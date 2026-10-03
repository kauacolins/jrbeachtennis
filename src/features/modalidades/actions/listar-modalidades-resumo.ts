"use server";

import { prisma } from "@/lib/prisma";

// Para a seção "Escolha seu jogo" da home: quantas quadras ativas cada
// modalidade tem e o preço mínimo por hora entre elas.
export async function listarModalidadesComResumo() {
  const modalidades = await prisma.modalidade.findMany({
    include: {
      quadras: {
        where: { ativa: true },
        select: { precoHoraCentavos: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  return modalidades
    .filter((m) => m.quadras.length > 0)
    .map((m) => ({
      id: m.id,
      nome: m.nome,
      quadrasCount: m.quadras.length,
      precoDesdeCentavos: Math.min(...m.quadras.map((q) => q.precoHoraCentavos)),
    }));
}

export type ModalidadeResumo = Awaited<
  ReturnType<typeof listarModalidadesComResumo>
>[number];

// Para a página de reserva por modalidade: como as quadras de uma mesma
// modalidade são equivalentes para o cliente, ele nunca escolhe qual — só
// precisamos saber se a modalidade existe e tem quadra ativa.
export async function obterModalidadeResumo(
  id: string
): Promise<ModalidadeResumo | null> {
  const modalidade = await prisma.modalidade.findUnique({
    where: { id },
    include: {
      quadras: {
        where: { ativa: true },
        select: { precoHoraCentavos: true },
      },
    },
  });

  if (!modalidade || modalidade.quadras.length === 0) return null;

  return {
    id: modalidade.id,
    nome: modalidade.nome,
    quadrasCount: modalidade.quadras.length,
    precoDesdeCentavos: Math.min(
      ...modalidade.quadras.map((q) => q.precoHoraCentavos)
    ),
  };
}
