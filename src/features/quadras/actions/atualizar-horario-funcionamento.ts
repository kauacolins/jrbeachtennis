"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import {
  atualizarHorarioFuncionamentoSchema,
  type AtualizarHorarioFuncionamentoInput,
} from "../schema";

export type AtualizarHorarioResultado = { ok: true } | { ok: false; erro: string };

function paraMinutos(hora: string) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

// RF11: horário de funcionamento por quadra e dia da semana. Dia sem
// registro em HorarioFuncionamento = fechado (ver listarHorariosDisponiveis).
export async function atualizarHorarioFuncionamento(
  input: AtualizarHorarioFuncionamentoInput
): Promise<AtualizarHorarioResultado> {
  if (!(await exigirAdmin())) {
    return { ok: false, erro: "Sem permissão." };
  }

  const parsed = atualizarHorarioFuncionamentoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      erro: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const { quadraId, dias } = parsed.data;

  for (const dia of dias) {
    if (!dia.fechada && paraMinutos(dia.abre) >= paraMinutos(dia.fecha)) {
      return {
        ok: false,
        erro: "O horário de abertura precisa ser antes do de fechamento.",
      };
    }
  }

  const quadra = await prisma.quadra.findUnique({ where: { id: quadraId } });
  if (!quadra) {
    return { ok: false, erro: "Quadra não encontrada." };
  }

  await prisma.$transaction(
    dias.map((dia) =>
      dia.fechada
        ? prisma.horarioFuncionamento.deleteMany({
            where: { quadraId, diaSemana: dia.diaSemana },
          })
        : prisma.horarioFuncionamento.upsert({
            where: {
              quadraId_diaSemana: { quadraId, diaSemana: dia.diaSemana },
            },
            update: {
              abreMin: paraMinutos(dia.abre),
              fechaMin: paraMinutos(dia.fecha),
            },
            create: {
              quadraId,
              diaSemana: dia.diaSemana,
              abreMin: paraMinutos(dia.abre),
              fechaMin: paraMinutos(dia.fecha),
            },
          })
    )
  );

  revalidatePath("/gerenciamento/horarios");
  revalidatePath("/gerenciamento");
  return { ok: true };
}
