"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { TIME_ZONE } from "@/lib/constants";
import { IMAGEM_EVENTO_TAMANHO_MAXIMO, IMAGEM_EVENTO_TIPOS_ACEITOS } from "@/lib/imagem-evento";
import { salvarEventoSchema, type SalvarEventoInput } from "../schema";

type Resultado = { ok: true } | { ok: false; erro: string };

// Cria ou edita o aviso mostrado no modal de entrada do site.
// imagem: File = troca a imagem; null = remove; undefined = mantém a atual.
export async function salvarEvento(
  input: SalvarEventoInput,
  imagem?: File | null
): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = salvarEventoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { eventoId, titulo, resumo, descricao, data: dataISO, hora, ativo } = parsed.data;

  let dadosImagem = {};
  if (imagem === null) {
    dadosImagem = { imagem: null, imagemTipo: null, imagemAtualizadaEm: null };
  } else if (imagem) {
    if (!IMAGEM_EVENTO_TIPOS_ACEITOS.includes(imagem.type)) {
      return { ok: false, erro: "A imagem precisa ser JPG, PNG ou WebP." };
    }
    if (imagem.size > IMAGEM_EVENTO_TAMANHO_MAXIMO) {
      return { ok: false, erro: "Imagem grande demais. Escolha outra." };
    }
    dadosImagem = {
      imagem: new Uint8Array(await imagem.arrayBuffer()),
      imagemTipo: imagem.type,
      imagemAtualizadaEm: new Date(),
    };
  }

  const data = {
    titulo,
    resumo: resumo || null,
    descricao: descricao || null,
    data: dataISO ? fromZonedTime(`${dataISO}T${hora || "00:00"}:00`, TIME_ZONE) : null,
    ativo,
    ...dadosImagem,
  };

  if (eventoId) {
    const existente = await prisma.evento.findUnique({ where: { id: eventoId }, select: { id: true } });
    if (!existente) return { ok: false, erro: "Evento não encontrado." };
    await prisma.evento.update({ where: { id: eventoId }, data });
  } else {
    await prisma.evento.create({ data });
  }

  revalidatePath("/gerenciamento/eventos");
  revalidatePath("/", "layout");
  return { ok: true };
}
