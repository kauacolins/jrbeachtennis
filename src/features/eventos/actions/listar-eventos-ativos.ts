"use server";

import { prisma } from "@/lib/prisma";
import { urlImagemEvento } from "@/lib/imagem-evento";

export type EventoFeedItem = {
  chave: string;
  titulo: string;
  resumo: string | null;
  imagemUrl: string | null;
  href: string;
};

// Feed do modal de entrada do site (público, sem checar sessão): avisos
// ativos cadastrados à mão + torneios com inscrição aberta, que entram
// automaticamente sem precisar de um Evento duplicado pra cada um.
export async function listarEventosAtivos(): Promise<EventoFeedItem[]> {
  const [eventos, torneios] = await Promise.all([
    prisma.evento.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { createdAt: "desc" }],
      select: { id: true, titulo: true, resumo: true, descricao: true, imagemAtualizadaEm: true },
    }),
    prisma.torneio.findMany({
      where: { status: "INSCRICOES_ABERTAS" },
      orderBy: { dataInicio: "asc" },
      select: { id: true, slug: true, nome: true, bannerUrl: true },
    }),
  ]);

  return [
    ...eventos.map((e) => ({
      chave: `evento:${e.id}`,
      titulo: e.titulo,
      resumo: e.resumo || e.descricao?.slice(0, 120) || null,
      imagemUrl: urlImagemEvento(e.id, e.imagemAtualizadaEm),
      href: `/eventos/${e.id}`,
    })),
    ...torneios.map((t) => ({
      chave: `torneio:${t.id}`,
      titulo: t.nome,
      resumo: "Inscrições abertas — garanta sua vaga.",
      imagemUrl: t.bannerUrl,
      href: `/torneios/${t.slug}`,
    })),
  ];
}
