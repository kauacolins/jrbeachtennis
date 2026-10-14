"use server";

import { prisma } from "@/lib/prisma";

// Admin: todos os torneios (inclusive rascunho e cancelado), mais recente
// primeiro.
export async function listarTorneios() {
  return prisma.torneio.findMany({
    orderBy: { dataInicio: "desc" },
    include: { _count: { select: { categorias: true } } },
  });
}

export type TorneioAdmin = Awaited<ReturnType<typeof listarTorneios>>[number];
