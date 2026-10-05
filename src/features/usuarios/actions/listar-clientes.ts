"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { Role } from "@/app/generated/prisma/enums";

// Gerenciamento > Equipe > Clientes: quem fez cadastro público em /entrar.
// Só visualização + edição de dados de contato pelo admin (ver
// atualizarCliente) — criar/excluir conta de cliente não é daqui, nasce e
// morre pelo próprio fluxo de autenticação do cliente.
export async function listarClientes() {
  if (!(await exigirAdmin())) {
    return [];
  }

  return prisma.user.findMany({
    where: { role: Role.CLIENT, removidoEm: null },
    select: {
      id: true,
      name: true,
      email: true,
      telefone: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export type ClienteAdmin = Awaited<ReturnType<typeof listarClientes>>[number];
