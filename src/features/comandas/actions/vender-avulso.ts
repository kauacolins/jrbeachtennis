"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { abrirVendaAvulsa, fecharComanda, lancarItensBar } from "../regras";
import { venderAvulsoSchema, type VenderAvulsoInput } from "../schema";

export type VenderAvulsoResultado =
  | { ok: true; comandaId: string; totalCentavos: number }
  | { ok: false; erro: string };

// RF39: cliente de balcão que não vai abrir comanda — escolhe os produtos,
// recebe e fecha numa ação só (ver docs/COMANDAS.md, "Venda avulsa").
export async function venderAvulso(input: VenderAvulsoInput): Promise<VenderAvulsoResultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = venderAvulsoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { itens, metodo } = parsed.data;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const { comandaId } = await abrirVendaAvulsa(tx);

      const lancado = await lancarItensBar(tx, { comandaId, itens });
      if (!lancado.ok) throw new ErroVenda(lancado.erro);

      const fechado = await fecharComanda(tx, { comandaId, metodo, agora: new Date() });
      if (!fechado.ok) throw new ErroVenda(fechado.erro);

      return { ok: true as const, comandaId, totalCentavos: fechado.totalCentavos };
    });

    revalidatePath("/gerenciamento/comandas");
    return resultado;
  } catch (e) {
    if (e instanceof ErroVenda) return { ok: false, erro: e.message };
    throw e;
  }
}

class ErroVenda extends Error {}
