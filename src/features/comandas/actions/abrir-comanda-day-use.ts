"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { dataParaISO } from "@/lib/format";
import { abrirComanda, adicionarDayUse } from "../regras";
import { adicionarDayUseSchema } from "../schema";

export type AbrirComandaDayUseResultado =
  | { ok: true; comandaId: string; cobertoPeloPlano: boolean; jaTinhaComanda: boolean }
  | { ok: false; erro: string };

// Erro de regra dentro da transação: lançar desfaz a comanda recém-aberta
// (sem day use não faz sentido ela ficar aberta vazia).
class ErroDayUse extends Error {}

// Atalho do dashboard e da tela de Day use: abre a comanda com o nome do
// cliente e já lança o day use de hoje nela, numa transação só. Se o
// cliente já tem comanda aberta com esse nome, lança nela em vez de dar o
// aviso de nome repetido.
export async function abrirComandaDayUse(clienteId: string): Promise<AbrirComandaDayUseResultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = adicionarDayUseSchema.pick({ clienteId: true }).safeParse({ clienteId });
  if (!parsed.success) return { ok: false, erro: "Dados inválidos." };

  const agora = new Date();
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findUnique({ where: { id: parsed.data.clienteId } });
      if (!cliente) throw new ErroDayUse("Cliente não encontrado.");

      const aberta = await abrirComanda(tx, cliente.nome);
      if (!aberta.ok && !aberta.existenteId) throw new ErroDayUse(aberta.erro);
      const comandaId = aberta.ok ? aberta.comandaId : aberta.existenteId!;

      const dayUse = await adicionarDayUse(tx, {
        comandaId,
        clienteId: cliente.id,
        dataISO: dataParaISO(agora),
        agora,
      });
      if (!dayUse.ok) throw new ErroDayUse(dayUse.erro);

      return { comandaId, cobertoPeloPlano: dayUse.cobertoPeloPlano, jaTinhaComanda: !aberta.ok };
    });

    revalidatePath("/gerenciamento/comandas");
    revalidatePath("/gerenciamento/day-use");
    revalidatePath("/gerenciamento");
    return { ok: true, ...resultado };
  } catch (erro) {
    if (erro instanceof ErroDayUse) return { ok: false, erro: erro.message };
    throw erro;
  }
}
