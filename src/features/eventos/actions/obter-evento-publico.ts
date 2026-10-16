"use server";

import { prisma } from "@/lib/prisma";
import { urlImagemEvento } from "@/lib/imagem-evento";

// Página de detalhe do evento (/eventos/[id]): só mostra se ainda ativo.
export async function obterEventoPublico(eventoId: string) {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    select: {
      id: true,
      titulo: true,
      descricao: true,
      data: true,
      ativo: true,
      imagemAtualizadaEm: true,
    },
  });
  if (!evento || !evento.ativo) return null;

  const { imagemAtualizadaEm, ...resto } = evento;
  return { ...resto, imagemUrl: urlImagemEvento(evento.id, imagemAtualizadaEm) };
}

export type EventoPublico = NonNullable<Awaited<ReturnType<typeof obterEventoPublico>>>;
