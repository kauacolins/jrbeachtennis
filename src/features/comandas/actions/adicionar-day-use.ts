"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { dataParaISO } from "@/lib/format";
import { adicionarDayUse } from "../regras";
import { adicionarDayUseSchema } from "../schema";

export type AdicionarDayUseResultado =
  | { ok: true; cobertoPeloPlano: boolean }
  | { ok: false; erro: string };

// RF36: day use na comanda — cria o passe de hoje pro cliente escolhido.
export async function adicionarDayUseComanda(input: {
  comandaId: string;
  clienteId: string;
}): Promise<AdicionarDayUseResultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = adicionarDayUseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Dados inválidos." };

  const agora = new Date();
  const resultado = await prisma.$transaction((tx) =>
    adicionarDayUse(tx, { ...parsed.data, dataISO: dataParaISO(agora), agora })
  );
  if (resultado.ok) {
    revalidatePath("/gerenciamento/comandas");
    revalidatePath("/gerenciamento/day-use");
  }
  return resultado;
}
