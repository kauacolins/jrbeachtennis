"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { TIME_ZONE } from "@/lib/constants";
import { dataParaISO } from "@/lib/format";
import { adicionarReserva } from "../regras";
import { adicionarReservaSchema } from "../schema";

function limitesDeHoje() {
  const hojeISO = dataParaISO(new Date());
  return {
    inicioDia: fromZonedTime(`${hojeISO}T00:00:00`, TIME_ZONE),
    fimDia: fromZonedTime(`${hojeISO}T23:59:59.999`, TIME_ZONE),
  };
}

// RF37: reservas de hoje que ainda podem entrar numa comanda (ativas, não
// pagas e fora de outra comanda).
export async function listarReservasParaComanda() {
  if (!(await exigirAdmin())) return [];

  const { inicioDia, fimDia } = limitesDeHoje();
  const reservas = await prisma.reserva.findMany({
    where: {
      inicio: { gte: inicioDia, lte: fimDia },
      status: { not: "CANCELADA" },
      pago: false,
      itemComanda: null,
    },
    include: { quadra: true, user: { select: { name: true } } },
    orderBy: { inicio: "asc" },
  });

  return reservas.map((r) => ({
    id: r.id,
    quadra: r.quadra.nome,
    inicio: r.inicio.toISOString(),
    fim: r.fim.toISOString(),
    nome: r.user?.name ?? r.nomeContato ?? "Sem nome",
    valorCentavos: r.valorCentavos,
  }));
}

export type ReservaParaComanda = Awaited<ReturnType<typeof listarReservasParaComanda>>[number];

export async function adicionarReservaComanda(input: {
  comandaId: string;
  reservaId: string;
}): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = adicionarReservaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Dados inválidos." };

  const resultado = await prisma.$transaction((tx) =>
    adicionarReserva(tx, { ...parsed.data, ...limitesDeHoje() })
  );
  if (resultado.ok) revalidatePath("/gerenciamento/comandas");
  return resultado;
}
