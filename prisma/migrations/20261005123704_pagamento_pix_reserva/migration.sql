-- AlterEnum
ALTER TYPE "StatusReserva" ADD VALUE 'PENDENTE_PAGAMENTO';

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "expiraEm" TIMESTAMP(3),
ADD COLUMN     "pagamentoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_pagamentoId_key" ON "Reserva"("pagamentoId");

