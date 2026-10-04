"use server";

import { prisma } from "@/lib/prisma";

// Admin precisa ver todas as quadras, inclusive inativas, pra ajustar o
// horário de funcionamento (RF11) — diferente de listarQuadras (RF04/RF05),
// que só mostra as ativas pro cliente reservar.
export async function listarQuadrasAdmin() {
  return prisma.quadra.findMany({
    include: { horarios: true, modalidades: true },
    orderBy: { nome: "asc" },
  });
}

export type QuadraAdmin = Awaited<ReturnType<typeof listarQuadrasAdmin>>[number];
