"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessaoAtual } from "@/lib/get-session";

export type CancelarReservaResultado =
  | { ok: true }
  | { ok: false; erro: string };

const PRAZO_CANCELAMENTO_MS = 24 * 60 * 60_000; // regra 7 do REQUISITOS.md

// RF09: cliente cancela a própria reserva até 24h antes do início. Depois
// disso, só o admin cancela.
export async function cancelarReserva(
  reservaId: string
): Promise<CancelarReservaResultado> {
  const sessao = await getSessaoAtual();
  if (!sessao?.user) {
    return { ok: false, erro: "Você precisa estar logado." };
  }

  const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (!reserva || reserva.userId !== sessao.user.id) {
    return { ok: false, erro: "Reserva não encontrada." };
  }
  if (reserva.status === "CANCELADA") {
    return { ok: false, erro: "Essa reserva já está cancelada." };
  }

  const limite = new Date(reserva.inicio.getTime() - PRAZO_CANCELAMENTO_MS);
  if (new Date() > limite) {
    return {
      ok: false,
      erro:
        "O prazo de 24h pra cancelar online já passou. Fale com a Arena JR.",
    };
  }

  await prisma.reserva.update({
    where: { id: reservaId },
    data: { status: "CANCELADA", canceladaEm: new Date() },
  });

  revalidatePath("/minhas-reservas");
  return { ok: true };
}
