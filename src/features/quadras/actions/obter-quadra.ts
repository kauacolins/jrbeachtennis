"use server";

import { prisma } from "@/lib/prisma";

// RF06: dados da quadra para a página de detalhe (modalidades + funcionamento).
export async function obterQuadra(id: string) {
  return prisma.quadra.findFirst({
    where: { id, ativa: true },
    include: {
      modalidades: true,
      horarios: { orderBy: { diaSemana: "asc" } },
    },
  });
}

export type QuadraDetalhada = NonNullable<
  Awaited<ReturnType<typeof obterQuadra>>
>;
