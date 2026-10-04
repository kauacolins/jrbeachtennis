"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";

export type CancelarReservaAdminResultado = { ok: true } | { ok: false; erro: string };

// RF15: admin cancela qualquer reserva, sem o prazo de 24h que vale pro
// cliente (ver cancelarReserva, que é a versão com essa restrição).
export async function cancelarReservaAdmin(
  reservaId: string
): Promise<CancelarReservaAdminResultado> {
  if (!(await exigirAdmin())) {
    return { ok: false, erro: "Sem permissão." };
  }

  const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (!reserva) {
    return { ok: false, erro: "Reserva não encontrada." };
  }
  if (reserva.status === "CANCELADA") {
    return { ok: false, erro: "Essa reserva já está cancelada." };
  }

  await prisma.reserva.update({
    where: { id: reservaId },
    data: { status: "CANCELADA", canceladaEm: new Date() },
  });

  revalidatePath("/gerenciamento");
  revalidatePath("/minhas-reservas");
  return { ok: true };
}
