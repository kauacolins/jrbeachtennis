"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";

type Resultado = { ok: true } | { ok: false; erro: string };

// Evento não é referenciado por nada, então pode excluir de verdade (sem o
// "só desativa" dos produtos do bar, que ficam no histórico das comandas).
export async function removerEvento(eventoId: string): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  await prisma.evento.delete({ where: { id: eventoId } }).catch(() => null);

  revalidatePath("/gerenciamento/eventos");
  revalidatePath("/", "layout");
  return { ok: true };
}
