"use server";

import { prisma } from "@/lib/prisma";

// RF05: lista de modalidades para os filtros do catálogo.
export async function listarModalidades() {
  return prisma.modalidade.findMany({ orderBy: { nome: "asc" } });
}

export type Modalidade = Awaited<ReturnType<typeof listarModalidades>>[number];
