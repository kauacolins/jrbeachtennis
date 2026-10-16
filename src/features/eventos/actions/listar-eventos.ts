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

export type EventoAdmin = Awaited<ReturnType<typeof listarEventosAdmin>>[number];
