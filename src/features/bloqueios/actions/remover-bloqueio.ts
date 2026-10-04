"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";

export type RemoverBloqueioResultado = { ok: true } | { ok: false; erro: string };

// RF12: remover um bloqueio antes do horário chegar.
export async function removerBloqueio(
  bloqueioId: string
): Promise<RemoverBloqueioResultado> {
  if (!(await exigirAdmin())) {
    return { ok: false, erro: "Sem permissão." };
  }

  await prisma.bloqueio.deleteMany({ where: { id: bloqueioId } });

  revalidatePath("/gerenciamento");
  revalidatePath("/gerenciamento/bloqueios");
  return { ok: true };
}
