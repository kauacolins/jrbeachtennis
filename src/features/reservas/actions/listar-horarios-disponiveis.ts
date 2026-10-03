"use server";

import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { DURACAO_MAXIMA_HORAS, TIME_ZONE } from "@/lib/constants";
import { diaSemanaDaData } from "@/lib/datas";

export type StatusSlot = "livre" | "ocupado" | "passado";

export interface Slot {
  inicio: string; // ISO UTC
  horaLabel: string; // "19:00" em America/Sao_Paulo
  status: StatusSlot;
  duracaoMaximaHoras: number; // 0 quando não livre
}

// RF06/RNF04: slots = funcionamento da quadra − reservas ativas − horário já passado.
export async function listarHorariosDisponiveis(
  quadraId: string,
  dataISO: string
): Promise<Slot[]> {
  const quadra = await prisma.quadra.findFirst({
    where: { id: quadraId, ativa: true },
    include: { horarios: true },
  });
  if (!quadra) return [];

  const diaSemana = diaSemanaDaData(dataISO);
  const horario = quadra.horarios.find((h) => h.diaSemana === diaSemana);
  if (!horario) return [];

  const inicioDiaUTC = fromZonedTime(`${dataISO}T00:00:00`, TIME_ZONE);
  const fimDiaUTC = fromZonedTime(`${dataISO}T23:59:59`, TIME_ZONE);

  const reservas = await prisma.reserva.findMany({
    where: {
      quadraId,
      status: { not: "CANCELADA" },
      inicio: { lt: fimDiaUTC },
      fim: { gt: inicioDiaUTC },
    },
    select: { inicio: true, fim: true },
  });

  const agora = new Date();
  const slots: Slot[] = [];

  for (
    let min = horario.abreMin;
    min + 60 <= horario.fechaMin;
    min += 60
  ) {
    const horas = String(Math.floor(min / 60)).padStart(2, "0");
    const minutos = String(min % 60).padStart(2, "0");
    const inicioSlot = fromZonedTime(
      `${dataISO}T${horas}:${minutos}:00`,
      TIME_ZONE
    );
    const fimSlot = new Date(inicioSlot.getTime() + 60 * 60_000);

    let status: StatusSlot = "livre";
    if (inicioSlot.getTime() <= agora.getTime()) {
      status = "passado";
    } else if (
      reservas.some((r) => r.inicio < fimSlot && r.fim > inicioSlot)
    ) {
      status = "ocupado";
    }

    slots.push({
      inicio: inicioSlot.toISOString(),
      horaLabel: `${horas}:${minutos}`,
      status,
      duracaoMaximaHoras: 0,
    });
  }

  for (let i = 0; i < slots.length; i++) {
    if (slots[i].status !== "livre") continue;
    let duracao = 0;
    for (let j = i; j < slots.length && duracao < DURACAO_MAXIMA_HORAS; j++) {
      if (slots[j].status !== "livre") break;
      duracao++;
    }
    slots[i].duracaoMaximaHoras = duracao;
  }

  return slots;
}
