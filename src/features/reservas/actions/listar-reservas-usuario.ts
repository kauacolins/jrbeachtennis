"use server";

import { prisma } from "@/lib/prisma";

// RF08: "Minhas reservas" — a quadra não aparece, só a modalidade (o
// cliente nunca escolhe/vê qual quadra específica foi usada).
export async function listarReservasUsuario(userId: string) {
  return prisma.reserva.findMany({
    where: { userId },
    select: {
      id: true,
      inicio: true,
      fim: true,
      valorCentavos: true,
      status: true,
      pago: true,
      modalidade: { select: { nome: true } },
    },
    orderBy: { inicio: "desc" },
  });
}

export type ReservaUsuario = Awaited<
  ReturnType<typeof listarReservasUsuario>
>[number];
