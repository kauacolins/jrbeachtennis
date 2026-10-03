"use server";

import { prisma } from "@/lib/prisma";

// RF04/RF05: listar quadras ativas, com filtro opcional por modalidade.
export async function listarQuadras(filtro?: {
  modalidadeId?: string;
  limite?: number;
}) {
  return prisma.quadra.findMany({
    where: {
      ativa: true,
      ...(filtro?.modalidadeId
        ? { modalidades: { some: { id: filtro.modalidadeId } } }
        : {}),
    },
    include: { modalidades: true },
    orderBy: { nome: "asc" },
    take: filtro?.limite,
  });
}

export type Quadra = Awaited<ReturnType<typeof listarQuadras>>[number];
