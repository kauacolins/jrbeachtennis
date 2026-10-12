"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";
import { cancelarComanda as cancelarComandaTx, fecharComanda as fecharComandaTx } from "../regras";
import { fecharComandaSchema, fecharComandasSchema } from "../schema";

function revalidar() {
  revalidatePath("/gerenciamento/comandas");
  revalidatePath("/gerenciamento/day-use");
  revalidatePath("/gerenciamento/agenda");
}

// RF34 + RF38: recebe, fecha e marca passe/reserva ligados como pagos.
export async function fecharComanda(input: {
  comandaId: string;
  metodo: MetodoPagamento;
}): Promise<{ ok: true; totalCentavos: number } | { ok: false; erro: string }> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = fecharComandaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const resultado = await prisma.$transaction((tx) =>
    fecharComandaTx(tx, { ...parsed.data, agora: new Date() })
  );
  if (resultado.ok) revalidar();
  return resultado;
}

// Fechar em lote (fim do dia, grupo que paga junto): mesma forma de pagamento
// pra todas. Tudo ou nada — se uma falhar, nenhuma fecha e o erro diz qual.
export async function fecharComandas(input: {
  comandaIds: string[];
  metodo: MetodoPagamento;
}): Promise<
  { ok: true; quantidade: number; totalCentavos: number } | { ok: false; erro: string }
> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = fecharComandasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const comandaIds = [...new Set(parsed.data.comandaIds)];
  const { metodo } = parsed.data;

  try {
    const totalCentavos = await prisma.$transaction(
      async (tx) => {
        const agora = new Date();
        let total = 0;
        for (const comandaId of comandaIds) {
          const resultado = await fecharComandaTx(tx, { comandaId, metodo, agora });
          if (!resultado.ok) {
            const comanda = await tx.comanda.findUnique({
              where: { id: comandaId },
              select: { nome: true },
            });
            throw new FalhaNoLote(comanda ? `${comanda.nome}: ${resultado.erro}` : resultado.erro);
          }
          total += resultado.totalCentavos;
        }
        return total;
      },
      { timeout: 30_000 }
    );
    revalidar();
    return { ok: true, quantidade: comandaIds.length, totalCentavos };
  } catch (erro) {
    if (erro instanceof FalhaNoLote) return { ok: false, erro: erro.message };
    throw erro;
  }
}

class FalhaNoLote extends Error {}

export async function cancelarComanda(
  comandaId: string
): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const resultado = await prisma.$transaction((tx) =>
    cancelarComandaTx(tx, comandaId, new Date())
  );
  if (resultado.ok) revalidar();
  return resultado;
}
