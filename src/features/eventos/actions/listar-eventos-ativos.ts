"use server";

import { prisma } from "@/lib/prisma";
import { urlImagemEvento } from "@/lib/imagem-evento";

export type EventoFeedItem = {
  chave: string;
  titulo: string;
  resumo: string | null;
  descricao: string | null;
  imagemUrl: string | null;
  // null = aviso só informativo, fecha no próprio modal. Preenchido = tem
  // destino (torneio, que precisa da tela de inscrição).
  href: string | null;
};

// Feed do modal de entrada do site (público, sem checar sessão): avisos
// ativos cadastrados à mão + torneios com inscrição aberta, que entram
// automaticamente sem precisar de um Evento duplicado pra cada um. Aviso não
// tem página de detalhe própria — o texto todo já vem aqui pro modal mostrar.
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
      resumo: e.resumo || null,
      descricao: e.descricao || null,
      imagemUrl: urlImagemEvento(e.id, e.imagemAtualizadaEm),
      href: null,
    })),
    ...torneios.map((t) => ({
      chave: `torneio:${t.id}`,
      titulo: t.nome,
      resumo: "Inscrições abertas — garanta sua vaga.",
      descricao: null,
      imagemUrl: t.bannerUrl,
      href: `/torneios/${t.slug}`,
    })),
  ];
}
