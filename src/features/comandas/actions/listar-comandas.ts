"use server";

import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { TIME_ZONE } from "@/lib/constants";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";

// RF31: painel de comandas abertas, com total parcial. As abertas de dia
// anterior são destacadas na tela pra o operador fechar (regra 6).
export async function listarComandasAbertas() {
  if (!(await exigirAdmin())) return [];

  const comandas = await prisma.comanda.findMany({
    where: { status: "ABERTA" },
    include: { _count: { select: { itens: true } } },
    orderBy: { abertaEm: "asc" },
  });

  return comandas.map((c) => ({
    id: c.id,
    nome: c.nome,
    totalCentavos: c.totalCentavos,
    abertaEm: c.abertaEm.toISOString(),
    qtdItens: c._count.itens,
  }));
}

export type ComandaResumo = Awaited<ReturnType<typeof listarComandasAbertas>>[number];

export async function obterComanda(comandaId: string) {
  if (!(await exigirAdmin())) return null;

  const comanda = await prisma.comanda.findUnique({
    where: { id: comandaId },
    include: { itens: { orderBy: { createdAt: "asc" } } },
  });
  if (!comanda) return null;

  return {
    id: comanda.id,
    nome: comanda.nome,
    status: comanda.status,
    totalCentavos: comanda.totalCentavos,
    metodo: comanda.metodo,
    abertaEm: comanda.abertaEm.toISOString(),
    fechadaEm: comanda.fechadaEm?.toISOString() ?? null,
    itens: comanda.itens.map((i) => ({
      id: i.id,
      tipo: i.tipo,
      produtoId: i.produtoId,
      descricao: i.descricao,
      quantidade: i.quantidade,
      precoUnitarioCentavos: i.precoUnitarioCentavos,
    })),
  };
}

export type ComandaDetalhe = NonNullable<Awaited<ReturnType<typeof obterComanda>>>;

// RF35: histórico do dia (fechadas e canceladas), com total vendido e
// quanto entrou por forma de pagamento.
export async function listarHistoricoComandas(dataISO: string) {
  if (!(await exigirAdmin())) return null;

  const inicio = fromZonedTime(`${dataISO}T00:00:00`, TIME_ZONE);
  const fim = fromZonedTime(`${dataISO}T23:59:59.999`, TIME_ZONE);

  const comandas = await prisma.comanda.findMany({
    where: { status: { not: "ABERTA" }, fechadaEm: { gte: inicio, lte: fim } },
    include: { _count: { select: { itens: true } } },
    orderBy: { fechadaEm: "desc" },
  });

  const fechadas = comandas.filter((c) => c.status === "FECHADA");
  const porMetodo = new Map<MetodoPagamento, number>();
  for (const c of fechadas) {
    if (!c.metodo) continue;
    porMetodo.set(c.metodo, (porMetodo.get(c.metodo) ?? 0) + c.totalCentavos);
  }

  return {
    totalCentavos: fechadas.reduce((soma, c) => soma + c.totalCentavos, 0),
    porMetodo: [...porMetodo.entries()].map(([metodo, totalCentavos]) => ({
      metodo,
      totalCentavos,
    })),
    comandas: comandas.map((c) => ({
      id: c.id,
      nome: c.nome,
      status: c.status,
      metodo: c.metodo,
      totalCentavos: c.totalCentavos,
      fechadaEm: c.fechadaEm?.toISOString() ?? null,
      qtdItens: c._count.itens,
    })),
  };
}

export type HistoricoComandas = NonNullable<Awaited<ReturnType<typeof listarHistoricoComandas>>>;
