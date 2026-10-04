"use server";

import { prisma } from "@/lib/prisma";

export interface ContatoReserva {
  nome: string;
  telefone: string;
  contaExiste: boolean;
}

// Usado na tela de /entrar quando se chega vindo do convite "acompanhar essa
// reserva": decide se manda pra login (telefone já tem conta) ou pra
// cadastro já com nome/telefone preenchidos (telefone novo).
export async function resolverContatoReserva(
  reservaId: string
): Promise<ContatoReserva | null> {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    select: { nomeContato: true, telefoneContato: true, userId: true },
  });

  if (!reserva || reserva.userId || !reserva.telefoneContato) return null;

  const contaExistente = await prisma.user.findFirst({
    where: { telefone: reserva.telefoneContato },
    select: { id: true },
  });

  return {
    nome: reserva.nomeContato ?? "",
    telefone: reserva.telefoneContato,
    contaExiste: Boolean(contaExistente),
  };
}
