"use server";

import { prisma } from "@/lib/prisma";

// Admin: todos os torneios (inclusive rascunho e cancelado), mais recente
// primeiro.
export async function listarTorneios() {
  const torneios = await prisma.torneio.findMany({
    orderBy: { dataInicio: "desc" },
    include: {
      _count: { select: { categorias: true } },
      categorias: {
        select: {
          _count: { select: { inscricoes: { where: { status: { not: "CANCELADA" } } } } },
        },
      },
    },
  });

  // totalInscritos soma as inscrições (exceto canceladas) de todas as
  // categorias — dá pra ver o movimento do torneio sem abrir o detalhe.
  return torneios.map(({ categorias, ...torneio }) => ({
    ...torneio,
    totalInscritos: categorias.reduce((soma, c) => soma + c._count.inscricoes, 0),
  }));
}

export type TorneioAdmin = Awaited<ReturnType<typeof listarTorneios>>[number];
