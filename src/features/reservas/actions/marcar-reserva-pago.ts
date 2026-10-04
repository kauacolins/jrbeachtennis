"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";

export type MarcarReservaPagoResultado = { ok: true } | { ok: false; erro: string };

// RF15: admin marca pagamento combinado no local (pago/não pago).
export async function marcarReservaPago(
  reservaId: string,
  pago: boolean
): Promise<MarcarReservaPagoResultado> {
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

  await prisma.reserva.update({ where: { id: reservaId }, data: { pago } });

  revalidatePath("/gerenciamento");
  return { ok: true };
}
