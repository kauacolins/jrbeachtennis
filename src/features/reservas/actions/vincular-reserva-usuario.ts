"use server";

import { prisma } from "@/lib/prisma";
import { getSessaoAtual } from "@/lib/get-session";

export type VincularReservaResultado =
  | { ok: true }
  | { ok: false; erro: string };

// Liga uma reserva feita como convidado (nome + telefone) à conta de quem
// acabou de entrar ou criar conta — só essa reserva específica. Nunca em
// lote por telefone: telefone não é verificado (RNF08) e poderia puxar a
// reserva de outra pessoa.
export async function vincularReservaAoUsuario(
  reservaId: string
): Promise<VincularReservaResultado> {
  const sessao = await getSessaoAtual();
  if (!sessao?.user) {
    return { ok: false, erro: "Você precisa estar logado." };
  }

  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    select: { userId: true },
  });
  if (!reserva) {
    return { ok: false, erro: "Reserva não encontrada." };
  }
  if (reserva.userId && reserva.userId !== sessao.user.id) {
    return { ok: false, erro: "Essa reserva já pertence a outra conta." };
  }

  await prisma.reserva.update({
    where: { id: reservaId },
    data: { userId: sessao.user.id },
  });

  return { ok: true };
}
