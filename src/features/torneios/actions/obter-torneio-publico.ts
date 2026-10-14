"use server";

import { prisma } from "@/lib/prisma";

// Página pública /torneios/[slug]: categorias com os inscritos (só nome,
// nunca celular — isso só o admin vê, em listarInscritos). Rascunho e
// cancelado não têm página pública.
export async function obterTorneioPublico(slug: string) {
  return prisma.torneio.findFirst({
    where: { slug, status: { notIn: ["RASCUNHO", "CANCELADO"] } },
    include: {
      categorias: {
        orderBy: [{ modalidade: { nome: "asc" } }, { ordem: "asc" }],
        include: {
          modalidade: true,
          inscricoes: {
            where: { status: { in: ["PENDENTE", "CONFIRMADA"] } },
            select: { id: true, nomeEquipe: true, atletas: { select: { nome: true } } },
          },
        },
      },
    },
  });
}

export type TorneioPublicoDetalhe = NonNullable<Awaited<ReturnType<typeof obterTorneioPublico>>>;
export type CategoriaPublica = TorneioPublicoDetalhe["categorias"][number];
