"use server";

import { prisma } from "@/lib/prisma";

// "Minhas inscrições": status de cada inscrição que o cliente fez (ver
// docs/TORNEIOS.md, tela "Minhas inscrições").
export async function listarMinhasInscricoes(userId: string) {
  return prisma.inscricao.findMany({
    where: { criadaPorId: userId },
    include: {
      categoria: { include: { torneio: true, modalidade: true } },
      atletas: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export type MinhaInscricao = Awaited<ReturnType<typeof listarMinhasInscricoes>>[number];
