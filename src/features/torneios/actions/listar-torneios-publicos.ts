"use server";

import { prisma } from "@/lib/prisma";

// Página pública /torneios: torneios com inscrição aberta e os próximos.
// Rascunho (só o admin vê) e cancelado ficam de fora.
export async function listarTorneiosPublicos() {
  return prisma.torneio.findMany({
    where: { status: { notIn: ["RASCUNHO", "CANCELADO"] } },
    orderBy: { dataInicio: "asc" },
    select: {
      id: true,
      slug: true,
      nome: true,
      descricao: true,
      bannerUrl: true,
      dataInicio: true,
      dataFim: true,
      status: true,
      inscricoesAbrem: true,
      inscricoesFecham: true,
    },
  });
}

export type TorneioPublico = Awaited<ReturnType<typeof listarTorneiosPublicos>>[number];
