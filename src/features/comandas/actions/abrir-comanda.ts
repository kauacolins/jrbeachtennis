"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { abrirComanda as abrirComandaTx } from "../regras";
import { abrirComandaSchema } from "../schema";

export type AbrirComandaResultado =
  | { ok: true; comandaId: string }
  | { ok: false; erro: string; existenteId?: string };

// RF32: abrir comanda digitando só o nome, com aviso de nome repetido.
export async function abrirComanda(nome: string): Promise<AbrirComandaResultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = abrirComandaSchema.safeParse({ nome });
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const resultado = await prisma.$transaction((tx) => abrirComandaTx(tx, parsed.data.nome));
  if (resultado.ok) revalidatePath("/gerenciamento/comandas");
  return resultado;
}
