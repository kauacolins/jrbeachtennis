"use server";

import { prisma } from "@/lib/prisma";

// Resumo do funcionamento pra rodapé e página de contato — não é por
// quadra, é só "das X às Y" considerando o intervalo de todas elas.
export async function obterHorarioGeral() {
  const horarios = await prisma.horarioFuncionamento.findMany({
    select: { abreMin: true, fechaMin: true },
  });
  if (horarios.length === 0) return null;

  const abreMin = Math.min(...horarios.map((h) => h.abreMin));
  const fechaMin = Math.max(...horarios.map((h) => h.fechaMin));
  const paraHora = (min: number) =>
    String(Math.floor(min / 60)).padStart(2, "0");

  return `Todos os dias, ${paraHora(abreMin)}h às ${paraHora(fechaMin)}h`;
}
