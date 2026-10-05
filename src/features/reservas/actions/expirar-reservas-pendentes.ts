"use server";

import { prisma } from "@/lib/prisma";

// Sem fila/cron nesse projeto — em vez de um job rodando de tempo em tempo
// pra liberar reserva com Pix que não caiu, cada leitura que importa
// (conflito de horário, listagem de slots, agenda do admin) chama isso
// primeiro: é barato (update indexado) e garante que ninguém vê um
// horário "ocupado" por uma reserva cujo prazo de pagamento já passou.
export async function expirarReservasPendentes() {
  await prisma.reserva.updateMany({
    where: { status: "PENDENTE_PAGAMENTO", expiraEm: { lt: new Date() } },
    data: { status: "CANCELADA", canceladaEm: new Date() },
  });
}
