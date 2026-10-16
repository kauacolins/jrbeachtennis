"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";

// Admin: todas as inscrições do torneio, com celular e status de
// pagamento — pra marcar pago, cancelar e exportar (ver docs/TORNEIOS.md).
export async function listarInscritos(torneioId: string) {
  if (!(await exigirAdmin())) return [];

  return prisma.inscricao.findMany({
    where: { categoria: { torneioId } },
    include: {
      categoria: { select: { id: true, nome: true, ordem: true } },
      atletas: true,
      criadaPor: { select: { name: true, email: true } },
    },
    orderBy: [{ categoria: { ordem: "asc" } }, { createdAt: "asc" }],
  });
}

export type InscricaoAdmin = Awaited<ReturnType<typeof listarInscritos>>[number];

// Dashboard (widget Pendências): inscrições aguardando pagamento em
// qualquer torneio, mais recentes primeiro — pra achar rápido quem ainda
// não pagou sem abrir cada torneio.
export async function listarInscricoesPendentes() {
  if (!(await exigirAdmin())) return [];

  return prisma.inscricao.findMany({
    where: { status: "PENDENTE" },
    include: {
      categoria: { select: { nome: true, torneio: { select: { id: true, nome: true } } } },
      atletas: { select: { nome: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type InscricaoPendente = Awaited<ReturnType<typeof listarInscricoesPendentes>>[number];
