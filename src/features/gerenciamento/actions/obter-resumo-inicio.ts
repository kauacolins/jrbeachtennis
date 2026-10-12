"use server";

import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { TIME_ZONE } from "@/lib/constants";

// Números que aparecem nos atalhos da tela inicial do gerenciamento: só
// contagens, pra a página abrir rápido.
export async function obterResumoInicio(hojeISO: string) {
  if (!(await exigirAdmin())) return null;

  const inicioDia = fromZonedTime(`${hojeISO}T00:00:00`, TIME_ZONE);
  const fimDia = fromZonedTime(`${hojeISO}T23:59:59`, TIME_ZONE);
  const reservasHoje = { status: { not: "CANCELADA" as const }, inicio: { gte: inicioDia, lte: fimDia } };

  const [comandas, reservas, reservasAPagar, dayUse, produtoDayUse] = await Promise.all([
    prisma.comanda.aggregate({
      where: { status: "ABERTA" },
      _count: true,
      _sum: { totalCentavos: true },
    }),
    prisma.reserva.count({ where: reservasHoje }),
    prisma.reserva.count({ where: { ...reservasHoje, pago: false } }),
    prisma.passeDayUse.count({ where: { data: hojeISO, canceladoEm: null } }),
    prisma.produto.findUnique({ where: { tipo: "DAY_USE" }, select: { limiteDiario: true } }),
  ]);

  return {
    comandasAbertas: comandas._count,
    totalAbertoCentavos: comandas._sum.totalCentavos ?? 0,
    reservasHoje: reservas,
    reservasAPagar,
    dayUseHoje: dayUse,
    dayUseLimite: produtoDayUse?.limiteDiario ?? null,
  };
}
