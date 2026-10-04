"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { criarQuadraSchema, type CriarQuadraInput } from "../schema";

export type CriarQuadraResultado = { ok: true; quadraId: string } | { ok: false; erro: string };

// RF10: cadastrar quadra (nome, modalidades, preço, ativa/inativa).
export async function criarQuadra(
  input: CriarQuadraInput
): Promise<CriarQuadraResultado> {
  if (!(await exigirAdmin())) {
    return { ok: false, erro: "Sem permissão." };
  }

  const parsed = criarQuadraSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, descricao, fotoUrl, precoHoraCentavos, ativa, modalidadeIds } = parsed.data;

  const modalidades = await prisma.modalidade.findMany({
    where: { id: { in: modalidadeIds } },
    select: { id: true },
  });
  if (modalidades.length !== modalidadeIds.length) {
    return { ok: false, erro: "Modalidade inválida." };
  }

  const quadra = await prisma.quadra.create({
    data: {
      nome,
      descricao: descricao || null,
      fotoUrl: fotoUrl || null,
      precoHoraCentavos,
      ativa,
      modalidades: { connect: modalidadeIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/gerenciamento/configuracoes/quadras");
  revalidatePath("/gerenciamento/horarios");
  revalidatePath("/gerenciamento/bloqueios");
  return { ok: true, quadraId: quadra.id };
}
