"use server";

import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import {
  DURACAO_MAXIMA_MIN,
  DURACAO_MINIMA_MIN,
  PASSO_RESERVA_MIN,
  TIME_ZONE,
} from "@/lib/constants";
import { diaSemanaDaData } from "@/lib/datas";

export type StatusSlot = "livre" | "ocupado" | "passado";

export interface Slot {
  inicio: string; // ISO UTC
  horaLabel: string; // "19:00" em America/Sao_Paulo
  status: StatusSlot;
  duracaoMaximaMinutos: number; // 0 quando não livre
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

  // Grade em blocos de meia hora (PASSO_RESERVA_MIN). Cada bloco sabe se
  // está livre; o slot que aparece pro cliente é um início onde cabe pelo
  // menos a duração mínima (1h) só com blocos livres.
  const blocos: { inicio: Date; min: number; livre: boolean; passado: boolean }[] = [];
  for (
    let min = horario.abreMin;
    min + PASSO_RESERVA_MIN <= horario.fechaMin;
    min += PASSO_RESERVA_MIN
  ) {
    const inicioBloco = fromZonedTime(
      `${dataISO}T${horaLabelDe(min)}:00`,
      TIME_ZONE
    );
    const fimBloco = new Date(inicioBloco.getTime() + PASSO_RESERVA_MIN * 60_000);
    blocos.push({
      inicio: inicioBloco,
      min,
      passado: inicioBloco.getTime() <= agora.getTime(),
      livre: !reservas.some((r) => r.inicio < fimBloco && r.fim > inicioBloco),
    });
  }

  const slots: Slot[] = [];
  for (let i = 0; i < blocos.length; i++) {
    const bloco = blocos[i];
    if (bloco.min + DURACAO_MINIMA_MIN > horario.fechaMin) break;

    let duracao = 0;
    for (
      let j = i;
      j < blocos.length && blocos[j].livre && duracao < DURACAO_MAXIMA_MIN;
      j++
    ) {
      duracao += PASSO_RESERVA_MIN;
    }

    // Meia hora livre espremida entre duas reservas não dá pra reservar
    // (mínimo 1h), então aparece como ocupada.
    const status: StatusSlot = bloco.passado
      ? "passado"
      : duracao >= DURACAO_MINIMA_MIN
        ? "livre"
        : "ocupado";

    slots.push({
      inicio: bloco.inicio.toISOString(),
      horaLabel: horaLabelDe(bloco.min),
      status,
      duracaoMaximaMinutos: status === "livre" ? duracao : 0,
    });
  }

  return slots;
}

function horaLabelDe(min: number) {
  const horas = String(Math.floor(min / 60)).padStart(2, "0");
  const minutos = String(min % 60).padStart(2, "0");
  return `${horas}:${minutos}`;
}
