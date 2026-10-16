"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import { TIME_ZONE } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import { BANNER_TAMANHO_MAXIMO, BANNER_TIPOS_ACEITOS } from "@/lib/banner-torneio";
import { blobHabilitado, enviarParaBlob, removerDoBlob } from "@/lib/blob";
import { salvarTorneioSchema, type SalvarTorneioInput } from "../schema";
import { cancelarTorneio } from "../regras";

export type SalvarTorneioResultado = { ok: true; torneioId: string } | { ok: false; erro: string };

// Sem slug informado (tela de criação, ver TorneioCriarForm): deriva do
// nome e acrescenta um número se já existir ("beneficente-2026-2").
async function gerarSlugUnico(nome: string, torneioIdAtual?: string): Promise<string> {
  const base = slugify(nome) || "torneio";
  let candidato = base;
  for (let sufixo = 2; ; sufixo++) {
    const repetido = await prisma.torneio.findFirst({
      where: { slug: candidato, ...(torneioIdAtual ? { id: { not: torneioIdAtual } } : {}) },
      select: { id: true },
    });
    if (!repetido) return candidato;
    candidato = `${base}-${sufixo}`;
  }
}

// Cria ou edita o torneio (docs/TORNEIOS.md). Só o admin — mexe em preço de
// inscrição das categorias também, mesma regra do RF30 (produtos).
// banner: File = troca, null = remove, undefined = mantém o atual (mesma
// convenção de salvarProdutoBar, só que a imagem vai pro Blob, não bytes).
export async function salvarTorneio(
  input: SalvarTorneioInput,
  banner?: File | null
): Promise<SalvarTorneioResultado> {
  if (!(await exigirSomenteAdmin())) return { ok: false, erro: "Só o admin altera torneios." };

  const parsed = salvarTorneioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const {
    torneioId,
    slug: slugInformado,
    nome,
    descricao,
    doacao,
    dataInicio,
    dataFim,
    inscricoesAbrem,
    inscricoesFecham,
    maxCategoriasAtleta,
    destaqueHome,
    destaqueAte,
    status,
  } = parsed.data;

  const existente = torneioId
    ? await prisma.torneio.findUnique({
        where: { id: torneioId },
        select: { id: true, bannerUrl: true },
      })
    : null;
  if (torneioId && !existente) return { ok: false, erro: "Torneio não encontrado." };

  let slug: string;
  if (slugInformado) {
    const repetido = await prisma.torneio.findFirst({
      where: { slug: slugInformado, ...(torneioId ? { id: { not: torneioId } } : {}) },
      select: { id: true },
    });
    if (repetido) return { ok: false, erro: "Já existe um torneio com esse slug." };
    slug = slugInformado;
  } else {
    slug = await gerarSlugUnico(nome, torneioId);
  }

  let bannerUrl = existente?.bannerUrl ?? null;
  if (banner === null) {
    if (existente?.bannerUrl) await removerDoBlob(existente.bannerUrl);
    bannerUrl = null;
  } else if (banner) {
    if (!blobHabilitado) {
      return { ok: false, erro: "Envio de banner não configurado (falta BLOB_READ_WRITE_TOKEN)." };
    }
    if (!BANNER_TIPOS_ACEITOS.includes(banner.type)) {
      return { ok: false, erro: "O banner precisa ser JPG ou WebP." };
    }
    if (banner.size > BANNER_TAMANHO_MAXIMO) {
      return { ok: false, erro: "Banner grande demais. Máximo 1 MB." };
    }
    try {
      bannerUrl = await enviarParaBlob(`torneios/${slug}-${Date.now()}`, banner);
    } catch {
      return { ok: false, erro: "Não foi possível enviar o banner agora. Tente de novo." };
    }
    if (existente?.bannerUrl) await removerDoBlob(existente.bannerUrl);
  }

  const data = {
    slug,
    nome,
    descricao: descricao || null,
    doacao: doacao || null,
    bannerUrl,
    destaqueHome,
    destaqueAte: destaqueAte ? fromZonedTime(destaqueAte, TIME_ZONE) : null,
    dataInicio: new Date(`${dataInicio}T00:00:00.000Z`),
    dataFim: new Date(`${dataFim}T00:00:00.000Z`),
    inscricoesAbrem: fromZonedTime(inscricoesAbrem, TIME_ZONE),
    inscricoesFecham: fromZonedTime(inscricoesFecham, TIME_ZONE),
    maxCategoriasAtleta: maxCategoriasAtleta ?? null,
    status,
  };

  const torneio = torneioId
    ? await prisma.torneio.update({ where: { id: torneioId }, data, select: { id: true } })
    : await prisma.torneio.create({ data, select: { id: true } });

  if (data.status === "CANCELADO") {
    await prisma.$transaction((tx) => cancelarTorneio(tx, torneio.id));
    revalidatePath(`/gerenciamento/torneios/${torneio.id}/inscritos`);
    revalidatePath("/gerenciamento/agenda");
    revalidatePath("/gerenciamento/quadras/bloqueios");
    revalidatePath("/minhas-inscricoes");
    revalidatePath("/torneios", "layout");
  }

  revalidatePath("/gerenciamento/torneios");
  revalidatePath(`/gerenciamento/torneios/${torneio.id}`);
  revalidatePath(`/gerenciamento/torneios/${torneio.id}/edicao`);
  revalidatePath("/"); // banner pode entrar ou sair da home
  revalidatePath("/", "layout"); // torneio pode entrar ou sair do modal de eventos (EventosModal)
  return { ok: true, torneioId: torneio.id };
}
