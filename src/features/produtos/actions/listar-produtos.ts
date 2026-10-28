"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { urlFotoProduto } from "@/lib/foto-produto";

// Nunca traz os bytes da foto — só o que precisa pra montar a URL dela.
const CAMPOS_PRODUTO_BAR = {
  id: true,
  nome: true,
  categoria: true,
  precoCentavos: true,
  precoDinamico: true,
  ativo: true,
  fotoAtualizadaEm: true,
} as const;

// RF30: todos os produtos do bar, inclusive inativos (tela de cadastro).
export async function listarProdutosBarAdmin() {
  if (!(await exigirAdmin())) return [];
  const produtos = await prisma.produtoBar.findMany({
    select: CAMPOS_PRODUTO_BAR,
    orderBy: [{ ativo: "desc" }, { categoria: "asc" }, { nome: "asc" }],
  });
  return produtos.map(({ fotoAtualizadaEm, ...p }) => ({
    ...p,
    fotoUrl: urlFotoProduto(p.id, fotoAtualizadaEm),
  }));
}

export type ProdutoBarAdmin = Awaited<ReturnType<typeof listarProdutosBarAdmin>>[number];

const DIAS_RANKING = 30;

// RF33 + regra 4: só ativos, com os mais vendidos nos últimos 30 dias no
// topo pra lançar com poucos toques.
export async function listarProdutosParaLancar() {
  if (!(await exigirAdmin())) return [];

  const desde = new Date(Date.now() - DIAS_RANKING * 24 * 60 * 60_000);
  const [produtos, vendas] = await Promise.all([
    prisma.produtoBar.findMany({
      where: { ativo: true },
      select: CAMPOS_PRODUTO_BAR,
      orderBy: { nome: "asc" },
    }),
    prisma.itemComanda.groupBy({
      by: ["produtoId"],
      where: { tipo: "BAR", createdAt: { gte: desde } },
      _sum: { quantidade: true },
    }),
  ]);

  const vendidos = new Map(vendas.map((v) => [v.produtoId, v._sum.quantidade ?? 0]));
  return produtos
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      precoCentavos: p.precoCentavos,
      precoDinamico: p.precoDinamico,
      fotoUrl: urlFotoProduto(p.id, p.fotoAtualizadaEm),
      vendidos: vendidos.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.vendidos - a.vendidos || a.nome.localeCompare(b.nome, "pt-BR"));
}

export type ProdutoParaLancar = Awaited<ReturnType<typeof listarProdutosParaLancar>>[number];

// RF17: day use e mensal (um registro de cada, criado na migration).
export async function listarProdutosBalcao() {
  if (!(await exigirAdmin())) return [];
  return prisma.produto.findMany({ orderBy: { tipo: "asc" } });
}

export type ProdutoBalcao = Awaited<ReturnType<typeof listarProdutosBalcao>>[number];
