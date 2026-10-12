"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { abrirComanda, lancarItensBar } from "../regras";
import { lancarPedidoSchema, type LancarPedidoInput } from "../schema";

export type LancarPedidoResultado =
  | { ok: true; comandaId: string }
  | { ok: false; erro: string };

// Tela "Pedido": lança o carrinho inteiro numa comanda aberta ou numa nova,
// tudo na mesma transação (se o lançamento falhar, a comanda nova não fica).
export async function lancarPedido(input: LancarPedidoInput): Promise<LancarPedidoResultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = lancarPedidoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { comandaId, novoNome, itens } = parsed.data;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      let id = comandaId;
      if (novoNome) {
        const aberta = await abrirComanda(tx, novoNome);
        if (!aberta.ok) return aberta;
        id = aberta.comandaId;
      }
      const lancado = await lancarItensBar(tx, { comandaId: id!, itens });
      // Desfaz a comanda recém-aberta se algum produto não pôde ser lançado.
      if (!lancado.ok) throw new ErroLancamento(lancado.erro);
      return { ok: true as const, comandaId: id! };
    });
    if (!resultado.ok) return { ok: false, erro: resultado.erro };

    revalidatePath("/gerenciamento/comandas");
    return resultado;
  } catch (e) {
    if (e instanceof ErroLancamento) return { ok: false, erro: e.message };
    throw e;
  }
}

class ErroLancamento extends Error {}
