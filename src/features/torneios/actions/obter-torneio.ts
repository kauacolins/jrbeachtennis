"use server";

import { prisma } from "@/lib/prisma";

// Admin: torneio com categorias (por modalidade/ordem) e quadras bloqueadas
// pra ele — tudo que a tela de detalhe precisa numa chamada só.
export async function obterTorneio(torneioId: string) {
  return prisma.torneio.findUnique({
    where: { id: torneioId },
    include: {
      categorias: {
        include: {
          modalidade: true,
          _count: { select: { inscricoes: { where: { status: { not: "CANCELADA" } } } } },
        },
        orderBy: [{ modalidade: { nome: "asc" } }, { ordem: "asc" }],
      },
      bloqueios: {
        include: { quadra: true },
        orderBy: { inicio: "asc" },
      },
    },
  });
}

export type TorneioDetalhe = NonNullable<Awaited<ReturnType<typeof obterTorneio>>>;
export type CategoriaDoTorneio = TorneioDetalhe["categorias"][number];
export type BloqueioDoTorneio = TorneioDetalhe["bloqueios"][number];
