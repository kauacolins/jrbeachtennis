"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import { FOTO_TAMANHO_MAXIMO, FOTO_TIPOS_ACEITOS } from "@/lib/foto-produto";
import { GRUPO_CATEGORIA_PRODUTO } from "@/features/selects/grupos";
import {
  atualizarProdutoSchema,
  salvarProdutoBarSchema,
  type AtualizarProdutoInput,
  type SalvarProdutoBarInput,
} from "../schema";

type Resultado = { ok: true } | { ok: false; erro: string };

// RF30: cria ou edita produto do bar. Sem exclusão — produto já vendido fica
// no histórico; pra tirar do cardápio, desativa (regra 4).
// foto: File = troca a foto; null = remove; undefined = mantém a atual.
export async function salvarProdutoBar(
  input: SalvarProdutoBarInput,
  foto?: File | null
): Promise<Resultado> {
  if (!(await exigirSomenteAdmin())) return { ok: false, erro: "Só o admin altera produtos." };

  const parsed = salvarProdutoBarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { produtoId, nome, categoria, precoCentavos, ativo } = parsed.data;

  let dadosFoto = {};
  if (foto === null) {
    dadosFoto = { foto: null, fotoTipo: null, fotoAtualizadaEm: null };
  } else if (foto) {
    if (!FOTO_TIPOS_ACEITOS.includes(foto.type)) {
      return { ok: false, erro: "A foto precisa ser JPG, PNG ou WebP." };
    }
    if (foto.size > FOTO_TAMANHO_MAXIMO) {
      return { ok: false, erro: "Foto grande demais. Escolha outra imagem." };
    }
    dadosFoto = {
      foto: new Uint8Array(await foto.arrayBuffer()),
      fotoTipo: foto.type,
      fotoAtualizadaEm: new Date(),
    };
  }

  const existente = produtoId
    ? await prisma.produtoBar.findUnique({
        where: { id: produtoId },
        select: { id: true, categoria: true },
      })
    : null;
  if (produtoId && !existente) return { ok: false, erro: "Produto não encontrado." };

  // Categoria vem das opções do grupo categoria_produto. Na edição, aceita
  // manter a que o produto já tinha, mesmo que a opção tenha sido desativada.
  if (categoria && categoria !== existente?.categoria) {
    const opcao = await prisma.selectOption.findFirst({
      where: { nome: categoria, ativo: true, grupo: { chave: GRUPO_CATEGORIA_PRODUTO } },
      select: { id: true },
    });
    if (!opcao) return { ok: false, erro: "Escolha uma categoria da lista." };
  }

  const data = { nome, categoria: categoria || null, precoCentavos, ativo, ...dadosFoto };

  if (produtoId) {
    await prisma.produtoBar.update({ where: { id: produtoId }, data, select: { id: true } });
  } else {
    await prisma.produtoBar.create({ data, select: { id: true } });
  }

  revalidatePath("/gerenciamento/produtos");
  revalidatePath("/gerenciamento/comandas");
  return { ok: true };
}

// RF17/RF18: preço do day use/mensal e limite diário do day use. Preço novo
// não muda o que já foi vendido (preço congelado, RN8).
export async function atualizarProduto(input: AtualizarProdutoInput): Promise<Resultado> {
  if (!(await exigirSomenteAdmin())) return { ok: false, erro: "Só o admin altera produtos." };

  const parsed = atualizarProdutoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { produtoId, precoCentavos, limiteDiario, ativo } = parsed.data;

  const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
  if (!produto) return { ok: false, erro: "Produto não encontrado." };

  await prisma.produto.update({
    where: { id: produtoId },
    data: {
      precoCentavos,
      ativo,
      // limite só faz sentido no day use
      limiteDiario: produto.tipo === "DAY_USE" ? limiteDiario : null,
    },
  });

  revalidatePath("/gerenciamento/produtos");
  revalidatePath("/gerenciamento/day-use");
  return { ok: true };
}
