"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { TIME_ZONE } from "@/lib/constants";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import { bloquearQuadraTorneioSchema, type BloquearQuadraTorneioInput } from "../schema";

export type BloquearQuadraTorneioResultado = { ok: true } | { ok: false; erro: string };

// Reserva a quadra pro torneio: cria um Bloqueio ligado a ele, do mesmo jeito
// que o bloqueio comum (RF12) — a agenda deixa de oferecer esse horário
// (docs/TORNEIOS.md, passo 3).
export async function bloquearQuadraTorneio(
  input: BloquearQuadraTorneioInput
): Promise<BloquearQuadraTorneioResultado> {
  if (!(await exigirSomenteAdmin())) return { ok: false, erro: "Só o admin altera torneios." };

  const parsed = bloquearQuadraTorneioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { torneioId, quadraId, dataISO, horaInicio, horaFim, motivo } = parsed.data;

  const inicio = fromZonedTime(`${dataISO}T${horaInicio}:00`, TIME_ZONE);
  const fim = fromZonedTime(`${dataISO}T${horaFim}:00`, TIME_ZONE);
  if (fim.getTime() <= inicio.getTime()) {
    return { ok: false, erro: "O fim precisa ser depois do início." };
  }

  const [torneio, quadra] = await Promise.all([
    prisma.torneio.findUnique({ where: { id: torneioId }, select: { id: true } }),
    prisma.quadra.findUnique({ where: { id: quadraId }, select: { id: true } }),
  ]);
  if (!torneio) return { ok: false, erro: "Torneio não encontrado." };
  if (!quadra) return { ok: false, erro: "Quadra não encontrada." };

  await prisma.bloqueio.create({
    data: { quadraId, torneioId, inicio, fim, motivo: motivo || null },
  });

  revalidatePath(`/gerenciamento/torneios/${torneioId}`);
  revalidatePath(`/gerenciamento/torneios/${torneioId}/edicao`);
  revalidatePath("/gerenciamento/agenda");
  revalidatePath("/gerenciamento/quadras/bloqueios");
  return { ok: true };
}
