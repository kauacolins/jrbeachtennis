"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { confirmarPagamentoInscricao as confirmarTx } from "../regras";

export type ConfirmarPagamentoInscricaoResultado = { ok: true } | { ok: false; erro: string };

// Pagamento confirmado à mão pelo admin na primeira versão (Pix pra chave
// da arena, ver docs/TORNEIOS.md — "Decidido").
export async function confirmarPagamentoInscricao(
  inscricaoId: string
): Promise<ConfirmarPagamentoInscricaoResultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const resultado = await prisma.$transaction((tx) => confirmarTx(tx, inscricaoId, new Date()));
  if (resultado.ok) {
    const inscricao = await prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { categoria: { select: { torneioId: true } } },
    });
    revalidatePath("/gerenciamento/torneios");
    if (inscricao) revalidatePath(`/gerenciamento/torneios/${inscricao.categoria.torneioId}`);
    revalidatePath("/minhas-inscricoes");
  }
  return resultado;
}
