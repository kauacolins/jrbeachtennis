"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { TIME_ZONE } from "@/lib/constants";
import { exigirAdmin } from "@/lib/require-admin";
import { criarBloqueioSchema, type CriarBloqueioInput } from "../schema";

export type CriarBloqueioResultado = { ok: true } | { ok: false; erro: string };

// RF12: bloqueio pontual de horário (manutenção, evento, feriado, day use) —
// ocupa a agenda do admin do mesmo jeito que uma reserva, sem cliente.
export async function criarBloqueio(
  input: CriarBloqueioInput
): Promise<CriarBloqueioResultado> {
  if (!(await exigirAdmin())) {
    return { ok: false, erro: "Sem permissão." };
  }

  const parsed = criarBloqueioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      erro: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const { quadraId, dataISO, horaInicio, horaFim, motivo } = parsed.data;

  const inicio = fromZonedTime(`${dataISO}T${horaInicio}:00`, TIME_ZONE);
  const fim = fromZonedTime(`${dataISO}T${horaFim}:00`, TIME_ZONE);
  if (fim.getTime() <= inicio.getTime()) {
    return { ok: false, erro: "O fim precisa ser depois do início." };
  }

  const quadra = await prisma.quadra.findUnique({ where: { id: quadraId } });
  if (!quadra) {
    return { ok: false, erro: "Quadra não encontrada." };
  }

  await prisma.bloqueio.create({
    data: { quadraId, inicio, fim, motivo: motivo || null },
  });

  revalidatePath("/gerenciamento");
  revalidatePath("/gerenciamento/quadras/bloqueios");
  return { ok: true };
}
