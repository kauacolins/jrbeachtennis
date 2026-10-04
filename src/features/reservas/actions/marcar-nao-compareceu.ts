"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { StatusReserva } from "@/app/generated/prisma/enums";

export type MarcarNaoCompareceuResultado = { ok: true } | { ok: false; erro: string };

// RF15: marca ou desfaz o não comparecimento (volta pra CONFIRMADA).
export async function marcarNaoCompareceu(
  reservaId: string,
  naoCompareceu: boolean
): Promise<MarcarNaoCompareceuResultado> {
  if (!(await exigirAdmin())) {
    return { ok: false, erro: "Sem permissão." };
  }

  const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (!reserva) {
    return { ok: false, erro: "Reserva não encontrada." };
  }
  if (reserva.status === "CANCELADA") {
    return { ok: false, erro: "Essa reserva está cancelada." };
  }

  await prisma.reserva.update({
    where: { id: reservaId },
    data: {
      status: naoCompareceu ? StatusReserva.NAO_COMPARECEU : StatusReserva.CONFIRMADA,
    },
  });

  revalidatePath("/gerenciamento");
  return { ok: true };
}
