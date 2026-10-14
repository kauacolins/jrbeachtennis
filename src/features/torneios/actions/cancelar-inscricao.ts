"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessaoAtual } from "@/lib/get-session";
import { exigirAdmin } from "@/lib/require-admin";
import { cancelarInscricao as cancelarTx } from "../regras";

export type CancelarInscricaoResultado = { ok: true } | { ok: false; erro: string };

// Quem cancela: o próprio cliente que inscreveu (em Minhas inscrições) ou o
// admin (na lista de inscritos do torneio).
export async function cancelarInscricao(inscricaoId: string): Promise<CancelarInscricaoResultado> {
  const [sessao, admin] = await Promise.all([getSessaoAtual(), exigirAdmin()]);
  if (!admin) {
    if (!sessao?.user) return { ok: false, erro: "Sem permissão." };
    const inscricao = await prisma.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { criadaPorId: true },
    });
    if (!inscricao || inscricao.criadaPorId !== sessao.user.id) {
      return { ok: false, erro: "Sem permissão." };
    }
  }

  const resultado = await prisma.$transaction((tx) => cancelarTx(tx, inscricaoId));
  if (resultado.ok) {
    revalidatePath("/minhas-inscricoes");
    revalidatePath("/torneios", "layout");
    revalidatePath("/gerenciamento/torneios");
  }
  return resultado;
}
