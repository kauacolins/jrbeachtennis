"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirSomenteAdmin } from "@/lib/require-admin";

export type RemoverBloqueioTorneioResultado = { ok: true } | { ok: false; erro: string };

// Libera a quadra de volta pra agenda normal.
export async function removerBloqueioTorneio(
  bloqueioId: string,
  torneioId: string
): Promise<RemoverBloqueioTorneioResultado> {
  if (!(await exigirSomenteAdmin())) return { ok: false, erro: "Só o admin altera torneios." };

  await prisma.bloqueio.deleteMany({ where: { id: bloqueioId, torneioId } });

  revalidatePath(`/gerenciamento/torneios/${torneioId}`);
  revalidatePath(`/gerenciamento/torneios/${torneioId}/edicao`);
  revalidatePath("/gerenciamento/agenda");
  revalidatePath("/gerenciamento/quadras/bloqueios");
  return { ok: true };
}
