"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { PAPEIS_EQUIPE } from "../schema";

// Gerenciamento > Configurações > Usuários: CRUD de contas de equipe
// (admin/operador/instrutor). Cliente não aparece aqui — removido (soft
// delete) também não, fica só no histórico via reservas/sessões antigas.
export async function listarUsuarios() {
  if (!(await exigirAdmin())) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      role: { in: [...PAPEIS_EQUIPE] },
      removidoEm: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      telefone: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export type UsuarioAdmin = Awaited<ReturnType<typeof listarUsuarios>>[number];
