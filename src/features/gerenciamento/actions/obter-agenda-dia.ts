"use server";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { TIME_ZONE } from "@/lib/constants";
import { diaSemanaDaData } from "@/lib/datas";
import { formatarTelefone } from "@/lib/format";
import { StatusReserva } from "@/app/generated/prisma/enums";

export type AgendaBlocoTipo = "reserva" | "bloqueio";

export interface AgendaBloco {
  tipo: AgendaBlocoTipo;
  id: string;
  inicioMin: number; // minutos desde 00:00 em America/Sao_Paulo
  fimMin: number;
  titulo: string;
  subtitulo?: string;
  status?: StatusReserva;
  pago?: boolean;
  valorCentavos?: number;
}

export interface AgendaQuadra {
  quadraId: string;
  nome: string;
  abreMin: number | null; // null = fechada nesse dia da semana
  fechaMin: number | null;
  blocos: AgendaBloco[];
}

export interface AgendaDia {
  dataISO: string;
  grade: { inicioMin: number; fimMin: number } | null;
  quadras: AgendaQuadra[];
}

function formatarTelefoneOuIndefinido(telefone: string | null | undefined) {
  return telefone ? formatarTelefone(telefone) : undefined;
}

function paraMinutosDoDia(data: Date) {
  const label = formatInTimeZone(data, TIME_ZONE, "HH:mm");
  const [horas, minutos] = label.split(":").map(Number);
  return horas * 60 + minutos;
}

// RF13: agenda geral do dia, com todas as quadras lado a lado — mesma
// fonte de dados que listarHorariosDisponiveis (RF06), só que agregada
// para todas as quadras de uma vez e com os detalhes da reserva/bloqueio
// em vez de só o status livre/ocupado.
export async function obterAgendaDia(dataISO: string): Promise<AgendaDia> {
  const diaSemana = diaSemanaDaData(dataISO);

  const quadras = await prisma.quadra.findMany({
    where: { ativa: true },
    include: { horarios: true },
    orderBy: { nome: "asc" },
  });

  if (quadras.length === 0) {
    return { dataISO, grade: null, quadras: [] };
  }

  const quadraIds = quadras.map((q) => q.id);
  const inicioDiaUTC = fromZonedTime(`${dataISO}T00:00:00`, TIME_ZONE);
  const fimDiaUTC = fromZonedTime(`${dataISO}T23:59:59`, TIME_ZONE);

  const [reservas, bloqueios] = await Promise.all([
    prisma.reserva.findMany({
      where: {
        quadraId: { in: quadraIds },
        status: { not: "CANCELADA" },
        inicio: { lt: fimDiaUTC },
        fim: { gt: inicioDiaUTC },
      },
      include: { user: { select: { name: true, telefone: true } } },
    }),
    prisma.bloqueio.findMany({
      where: {
        quadraId: { in: quadraIds },
        inicio: { lt: fimDiaUTC },
        fim: { gt: inicioDiaUTC },
      },
    }),
  ]);

  const quadrasAgenda: AgendaQuadra[] = quadras.map((quadra) => {
    const horario = quadra.horarios.find((h) => h.diaSemana === diaSemana);

    const blocosReserva: AgendaBloco[] = reservas
      .filter((r) => r.quadraId === quadra.id)
      .map((r) => ({
        tipo: "reserva" as const,
        id: r.id,
        inicioMin: paraMinutosDoDia(r.inicio),
        fimMin: paraMinutosDoDia(r.fim),
        titulo: r.nomeContato ?? r.user?.name ?? "Cliente",
        subtitulo: formatarTelefoneOuIndefinido(r.telefoneContato ?? r.user?.telefone),
        status: r.status,
        pago: r.pago,
        valorCentavos: r.valorCentavos,
      }));

    const blocosBloqueio: AgendaBloco[] = bloqueios
      .filter((b) => b.quadraId === quadra.id)
      .map((b) => ({
        tipo: "bloqueio" as const,
        id: b.id,
        inicioMin: paraMinutosDoDia(b.inicio),
        fimMin: paraMinutosDoDia(b.fim),
        titulo: b.motivo || "Bloqueado",
      }));

    return {
      quadraId: quadra.id,
      nome: quadra.nome,
      abreMin: horario?.abreMin ?? null,
      fechaMin: horario?.fechaMin ?? null,
      blocos: [...blocosReserva, ...blocosBloqueio].sort(
        (a, b) => a.inicioMin - b.inicioMin
      ),
    };
  });

  const abertas = quadrasAgenda.filter(
    (q): q is AgendaQuadra & { abreMin: number; fechaMin: number } =>
      q.abreMin !== null && q.fechaMin !== null
  );

  const grade = abertas.length
    ? {
        inicioMin: Math.min(...abertas.map((q) => q.abreMin)),
        fimMin: Math.max(...abertas.map((q) => q.fechaMin)),
      }
    : null;

  return { dataISO, grade, quadras: quadrasAgenda };
}
