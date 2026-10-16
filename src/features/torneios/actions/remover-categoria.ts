"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { exigirSomenteAdmin } from "@/lib/require-admin";

export type RemoverCategoriaResultado = { ok: true } | { ok: false; erro: string };

// Bloqueada pelo banco (RESTRICT) se já tiver inscrição — nesse caso o
// admin cancela as inscrições antes (tela Inscritos) ou deixa a categoria
// como está.
export async function removerCategoria(
  categoriaId: string,
  torneioId: string
): Promise<RemoverCategoriaResultado> {
  if (!(await exigirSomenteAdmin())) return { ok: false, erro: "Só o admin altera categorias." };

  try {
    await prisma.categoria.deleteMany({ where: { id: categoriaId, torneioId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, erro: "Essa categoria já tem inscrição. Cancele as inscrições antes de excluir." };
    }
    throw error;
  }

  revalidatePath(`/gerenciamento/torneios/${torneioId}`);
  revalidatePath(`/gerenciamento/torneios/${torneioId}/edicao`);
  return { ok: true };
}
