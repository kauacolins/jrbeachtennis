"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";
import { ativarPlanoSchema } from "../schema";

const DIA_MS = 24 * 60 * 60_000;
export type FiltroPlano = "todos" | "ativos" | "vencendo" | "vencidos";
const DIAS_AVISO_VENCIMENTO = 7;

// RF20: lista o plano mais recente de cada cliente que já teve mensal,
// filtrado por situação. "Vencendo" = ativo com até 7 dias de validade;
// "todos" mostra as três situações juntas (o card sinaliza a cor de cada).
export async function listarPlanos(filtro: FiltroPlano) {
  if (!(await exigirAdmin())) return [];

  const agora = new Date();
  const assinaturas = await prisma.assinatura.findMany({
    where: { pago: true },
    include: { cliente: { select: { id: true, nome: true, telefone: true } } },
    orderBy: { fim: "desc" },
  });

  // Fica só com a mais recente de cada cliente (já vêm ordenadas por fim).
  const ultimaPorCliente = new Map<string, (typeof assinaturas)[number]>();
  for (const a of assinaturas) {
    if (!ultimaPorCliente.has(a.clienteId)) ultimaPorCliente.set(a.clienteId, a);
  }

  const limiteAviso = new Date(agora.getTime() + DIAS_AVISO_VENCIMENTO * DIA_MS);
  return [...ultimaPorCliente.values()]
    .map((a) => {
      const ativo = !a.canceladaEm && a.inicio <= agora && a.fim > agora;
      return {
        id: a.id,
        clienteId: a.cliente.id,
        nome: a.cliente.nome,
        telefone: a.cliente.telefone,
        inicio: a.inicio.toISOString(),
        fim: a.fim.toISOString(),
        cancelado: Boolean(a.canceladaEm),
        ativo,
        vencendo: ativo && a.fim <= limiteAviso,
        // Dias inteiros até vencer (negativo = já venceu), pro card.
        diasRestantes: Math.ceil((a.fim.getTime() - agora.getTime()) / DIA_MS),
      };
    })
    .filter((p) =>
      filtro === "todos"
        ? true
        : filtro === "ativos"
          ? p.ativo
          : filtro === "vencendo"
            ? p.vencendo
            : !p.ativo
    )
    .sort((a, b) =>
      filtro === "vencidos" ? b.fim.localeCompare(a.fim) : a.fim.localeCompare(b.fim)
    );
}

export type PlanoLinha = Awaited<ReturnType<typeof listarPlanos>>[number];

// RF20: ativar ou renovar no balcão, já pago. Renovação começa no fim do
// plano atual (não perde os dias que faltavam); sem plano ativo, começa agora.
export async function ativarPlano(input: {
  clienteId: string;
  metodo: MetodoPagamento;
}): Promise<{ ok: true; fim: string } | { ok: false; erro: string }> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = ativarPlanoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { clienteId, metodo } = parsed.data;

  const resultado = await prisma.$transaction(async (tx) => {
    const produto = await tx.produto.findUnique({ where: { tipo: "MENSAL" } });
    if (!produto || !produto.ativo) {
      return { ok: false as const, erro: "Plano mensal indisponível no momento." };
    }
    const cliente = await tx.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) return { ok: false as const, erro: "Cliente não encontrado." };

    const agora = new Date();
    const vigente = await tx.assinatura.findFirst({
      where: { clienteId, pago: true, canceladaEm: null, fim: { gt: agora } },
      orderBy: { fim: "desc" },
    });
    const inicio = vigente ? vigente.fim : agora;
    const fim = new Date(inicio.getTime() + (produto.duracaoDias ?? 30) * DIA_MS);

    await tx.assinatura.create({
      data: {
        clienteId,
        produtoId: produto.id,
        inicio,
        fim,
        valorCentavos: produto.precoCentavos,
        pago: true,
        metodo,
      },
    });
    return { ok: true as const, fim: fim.toISOString() };
  });

  if (resultado.ok) revalidatePath("/gerenciamento/planos");
  return resultado;
}

// RF20: cancela o plano vigente (e os já renovados à frente) do cliente.
// Passes que ele já usou continuam valendo.
export async function cancelarPlano(
  clienteId: string
): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const agora = new Date();
  const { count } = await prisma.assinatura.updateMany({
    where: { clienteId, canceladaEm: null, fim: { gt: agora } },
    data: { canceladaEm: agora },
  });
  if (count === 0) return { ok: false, erro: "Esse cliente não tem plano ativo." };

  revalidatePath("/gerenciamento/planos");
  return { ok: true };
}
