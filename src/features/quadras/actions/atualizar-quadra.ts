"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { atualizarQuadraSchema, type AtualizarQuadraInput } from "../schema";

export type AtualizarQuadraResultado = { ok: true } | { ok: false; erro: string };

// RF10: editar quadra (nome, modalidades, preço, ativa/inativa).
export async function atualizarQuadra(
  input: AtualizarQuadraInput
): Promise<AtualizarQuadraResultado> {
  if (!(await exigirAdmin())) {
    return { ok: false, erro: "Sem permissão." };
  }

  const parsed = atualizarQuadraSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { quadraId, nome, descricao, fotoUrl, precoHoraCentavos, ativa, modalidadeIds } =
    parsed.data;

  const quadra = await prisma.quadra.findUnique({ where: { id: quadraId } });
  if (!quadra) {
    return { ok: false, erro: "Quadra não encontrada." };
  }

  const modalidades = await prisma.modalidade.findMany({
    where: { id: { in: modalidadeIds } },
    select: { id: true },
  });
  if (modalidades.length !== modalidadeIds.length) {
    return { ok: false, erro: "Modalidade inválida." };
  }

  await prisma.quadra.update({
    where: { id: quadraId },
    data: {
      nome,
      descricao: descricao || null,
      fotoUrl: fotoUrl || null,
      precoHoraCentavos,
      ativa,
      modalidades: { set: modalidadeIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/gerenciamento/quadras");
  revalidatePath("/gerenciamento/quadras/horarios");
  revalidatePath("/gerenciamento/quadras/bloqueios");
  revalidatePath("/gerenciamento");
  return { ok: true };
}
