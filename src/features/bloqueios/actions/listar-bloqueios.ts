"use server";

import { prisma } from "@/lib/prisma";

// RF12: bloqueios que ainda não terminaram, pra tela de gerenciamento.
export async function listarBloqueiosFuturos() {
  return prisma.bloqueio.findMany({
    where: { fim: { gt: new Date() } },
    include: { quadra: { select: { nome: true } } },
    orderBy: { inicio: "asc" },
  });
}

export type BloqueioFuturo = Awaited<
  ReturnType<typeof listarBloqueiosFuturos>
>[number];
