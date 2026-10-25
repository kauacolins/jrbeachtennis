"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { urlImagemEvento } from "@/lib/imagem-evento";

// Nunca traz os bytes da imagem — só o que precisa pra montar a URL dela.
const CAMPOS_EVENTO = {
  id: true,
  titulo: true,
  resumo: true,
  descricao: true,
  data: true,
  ativo: true,
  imagemAtualizadaEm: true,
} as const;

// Todos os eventos, inclusive inativos (tela de cadastro).
export async function listarEventosAdmin() {
  if (!(await exigirAdmin())) return [];
  const eventos = await prisma.evento.findMany({
    select: CAMPOS_EVENTO,
    orderBy: [{ ativo: "desc" }, { ordem: "asc" }, { createdAt: "desc" }],
  });
  return eventos.map(({ imagemAtualizadaEm, ...e }) => ({
    ...e,
    imagemUrl: urlImagemEvento(e.id, imagemAtualizadaEm),
  }));
}

// Um evento pra tela de edição (/gerenciamento/eventos/[id]).
export async function obterEventoAdmin(eventoId: string) {
  if (!(await exigirAdmin())) return null;
  const evento = await prisma.evento.findUnique({ where: { id: eventoId }, select: CAMPOS_EVENTO });
  if (!evento) return null;
  const { imagemAtualizadaEm, ...resto } = evento;
  return { ...resto, imagemUrl: urlImagemEvento(evento.id, imagemAtualizadaEm) };
}

export type EventoAdmin = Awaited<ReturnType<typeof listarEventosAdmin>>[number];
