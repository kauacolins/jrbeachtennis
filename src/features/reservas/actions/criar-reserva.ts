"use server";

import { revalidatePath } from "next/cache";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { JANELA_MAXIMA_DIAS, TIME_ZONE } from "@/lib/constants";
import { diaSemanaDaData } from "@/lib/datas";
import { getSessaoAtual } from "@/lib/get-session";
import { criarReservaSchema, type CriarReservaInput } from "../schema";

export type CriarReservaResultado =
  | {
      ok: true;
      reservaId: string;
      inicio: string;
      fim: string;
      valorCentavos: number;
      // se quem reservou já estava logado, não precisa oferecer login depois.
      logado: boolean;
    }
  | { ok: false; erro: string };

function minutosDoDia(horaMin: string) {
  const [horas, minutos] = horaMin.split(":").map(Number);
  return horas * 60 + minutos;
}

// RNF04: toda regra de conflito, horário e janela é checada de novo aqui,
// mesmo que a UI já tenha filtrado — o servidor é a fonte da verdade.
export async function criarReserva(
  input: CriarReservaInput
): Promise<CriarReservaResultado> {
  const parsed = criarReservaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      erro: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { quadraId, modalidadeId, inicioISO, duracaoHoras, nomeContato, telefoneContato } =
    parsed.data;

  const inicio = new Date(inicioISO);
  if (Number.isNaN(inicio.getTime())) {
    return { ok: false, erro: "Horário inválido." };
  }

  const agora = new Date();
  if (inicio.getTime() <= agora.getTime()) {
    return { ok: false, erro: "Esse horário já passou. Escolha outro." };
  }

  const limiteFuturo = new Date(
    agora.getTime() + JANELA_MAXIMA_DIAS * 24 * 60 * 60_000
  );
  if (inicio.getTime() > limiteFuturo.getTime()) {
    return {
      ok: false,
      erro: `Só é possível reservar até ${JANELA_MAXIMA_DIAS} dias de antecedência.`,
    };
  }

  const horaLocal = formatInTimeZone(inicio, TIME_ZONE, "HH:mm");
  if (!horaLocal.endsWith(":00")) {
    return { ok: false, erro: "A reserva precisa começar em uma hora cheia." };
  }

  const fim = new Date(inicio.getTime() + duracaoHoras * 60 * 60_000);
  const dataLocal = formatInTimeZone(inicio, TIME_ZONE, "yyyy-MM-dd");
  const diaSemana = diaSemanaDaData(dataLocal);

  const horaInicioMin = minutosDoDia(horaLocal);
  const horaFimMin = horaInicioMin + duracaoHoras * 60;

  const sessao = await getSessaoAtual();
  const userId = sessao?.user?.id;

  const resultado = await prisma.$transaction(async (tx): Promise<CriarReservaResultado> => {
    const quadra = await tx.quadra.findFirst({
      where: { id: quadraId, ativa: true },
      include: { modalidades: true, horarios: true },
    });
    if (!quadra) {
      return { ok: false, erro: "Quadra não encontrada ou inativa." };
    }

    if (!quadra.modalidades.some((m) => m.id === modalidadeId)) {
      return { ok: false, erro: "Modalidade inválida para esta quadra." };
    }

    const horario = quadra.horarios.find((h) => h.diaSemana === diaSemana);
    if (
      !horario ||
      horaInicioMin < horario.abreMin ||
      horaFimMin > horario.fechaMin
    ) {
      return {
        ok: false,
        erro: "Esse horário está fora do funcionamento da quadra.",
      };
    }

    const conflito = await tx.reserva.findFirst({
      where: {
        quadraId,
        status: { not: "CANCELADA" },
        inicio: { lt: fim },
        fim: { gt: inicio },
      },
      select: { id: true },
    });
    if (conflito) {
      return {
        ok: false,
        erro: "Esse horário acabou de ser reservado. Escolha outro.",
      };
    }

    const valorCentavos = quadra.precoHoraCentavos * duracaoHoras;

    const reserva = await tx.reserva.create({
      data: {
        quadraId,
        modalidadeId,
        userId,
        nomeContato,
        telefoneContato,
        inicio,
        fim,
        valorCentavos,
      },
    });

    return {
      ok: true,
      reservaId: reserva.id,
      inicio: reserva.inicio.toISOString(),
      fim: reserva.fim.toISOString(),
      valorCentavos: reserva.valorCentavos,
      logado: Boolean(userId),
    };
  });

  if (resultado.ok) {
    revalidatePath(`/reservar/${modalidadeId}`);
  }

  return resultado;
}
