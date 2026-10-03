"use server";

import { prisma } from "@/lib/prisma";
import {
  listarHorariosDisponiveis,
  type Slot,
  type StatusSlot,
} from "@/features/reservas/actions/listar-horarios-disponiveis";

const PRIORIDADE_STATUS: Record<StatusSlot, number> = {
  livre: 2,
  ocupado: 1,
  passado: 0,
};

// Como as quadras de uma modalidade são equivalentes para o cliente, a
// agenda que ele vê é a união das quadras: um horário só aparece "ocupado"
// se NENHUMA quadra daquela modalidade estiver livre nele. Qual quadra
// específica vai ser usada só é decidido na hora de confirmar a reserva
// (ver criar-reserva-modalidade.ts).
export async function listarHorariosDisponiveisPorModalidade(
  modalidadeId: string,
  dataISO: string
): Promise<Slot[]> {
  const quadras = await prisma.quadra.findMany({
    where: { ativa: true, modalidades: { some: { id: modalidadeId } } },
    select: { id: true },
  });
  if (quadras.length === 0) return [];

  const porQuadra = await Promise.all(
    quadras.map((q) => listarHorariosDisponiveis(q.id, dataISO))
  );

  const porHora = new Map<string, Slot>();
  for (const slots of porQuadra) {
    for (const slot of slots) {
      const atual = porHora.get(slot.horaLabel);
      if (!atual || PRIORIDADE_STATUS[slot.status] > PRIORIDADE_STATUS[atual.status]) {
        porHora.set(slot.horaLabel, { ...slot });
      } else if (slot.status === atual.status) {
        atual.duracaoMaximaHoras = Math.max(
          atual.duracaoMaximaHoras,
          slot.duracaoMaximaHoras
        );
      }
    }
  }

  return Array.from(porHora.values()).sort((a, b) =>
    a.horaLabel.localeCompare(b.horaLabel)
  );
}
