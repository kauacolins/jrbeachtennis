"use server";

import { prisma } from "@/lib/prisma";
import { pagamentoPixHabilitado, paymentMercadoPago } from "@/lib/mercadopago";
import type { StatusReserva } from "@/app/generated/prisma/enums";

export type ConsultarReservaResultado =
  | { ok: true; status: StatusReserva; pago: boolean }
  | { ok: false; erro: string };

// Chamado em polling pela tela de pagamento (ver PagamentoPix) enquanto a
// reserva está PENDENTE_PAGAMENTO. Existe pra não depender só do webhook:
// em desenvolvimento local o Mercado Pago não consegue alcançar
// localhost, então sem isso o pagamento cairia mas a reserva nunca
// confirmaria sozinha. Reconsulta o pagamento na API do MP a cada
// chamada — nunca confia em nada vindo do cliente.
export async function consultarReserva(reservaId: string): Promise<ConsultarReservaResultado> {
  const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (!reserva) {
    return { ok: false, erro: "Reserva não encontrada." };
  }

  if (reserva.status !== "PENDENTE_PAGAMENTO") {
    return { ok: true, status: reserva.status, pago: reserva.pago };
  }

  if (reserva.expiraEm && reserva.expiraEm.getTime() <= Date.now()) {
    await prisma.reserva.update({
      where: { id: reserva.id },
      data: { status: "CANCELADA", canceladaEm: new Date() },
    });
    return { ok: true, status: "CANCELADA", pago: false };
  }

  if (!pagamentoPixHabilitado || !reserva.pagamentoId) {
    return { ok: true, status: reserva.status, pago: reserva.pago };
  }

  try {
    const pagamento = await paymentMercadoPago().get({ id: reserva.pagamentoId });
    if (pagamento.status === "approved") {
      await prisma.reserva.update({
        where: { id: reserva.id },
        data: { status: "CONFIRMADA", pago: true },
      });
      return { ok: true, status: "CONFIRMADA", pago: true };
    }
    if (pagamento.status === "rejected" || pagamento.status === "cancelled") {
      await prisma.reserva.update({
        where: { id: reserva.id },
        data: { status: "CANCELADA", canceladaEm: new Date() },
      });
      return { ok: true, status: "CANCELADA", pago: false };
    }
  } catch (error) {
    console.error("[mercadopago] erro ao consultar pagamento", error);
  }

  return { ok: true, status: reserva.status, pago: reserva.pago };
}
