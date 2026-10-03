"use server";

import { prisma } from "@/lib/prisma";
import { criarReserva, type CriarReservaResultado } from "./criar-reserva";
import {
  criarReservaModalidadeSchema,
  type CriarReservaModalidadeInput,
} from "../schema";

// O cliente não escolhe quadra — só modalidade e horário. Como as quadras de
// uma modalidade são equivalentes, tentamos criar a reserva em cada uma até
// achar uma livre; cada tentativa já revalida tudo (ver criar-reserva.ts).
export async function criarReservaPorModalidade(
  input: CriarReservaModalidadeInput
): Promise<CriarReservaResultado> {
  const parsed = criarReservaModalidadeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      erro: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const quadras = await prisma.quadra.findMany({
    where: { ativa: true, modalidades: { some: { id: parsed.data.modalidadeId } } },
    select: { id: true },
  });

  if (quadras.length === 0) {
    return { ok: false, erro: "Modalidade sem quadra disponível." };
  }

  let ultimoErro = "Esse horário acabou de ser reservado. Escolha outro.";

  for (const quadra of quadras) {
    const resultado = await criarReserva({ ...parsed.data, quadraId: quadra.id });
    if (resultado.ok) return resultado;
    ultimoErro = resultado.erro;
  }

  return { ok: false, erro: ultimoErro };
}
