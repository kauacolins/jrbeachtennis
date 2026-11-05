"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { carregarAlunos } from "../alunos";
import type { SituacaoAluno } from "../regras";

type Contagem = Record<SituacaoAluno, number>;

function contarSituacoes(alunos: { situacao: SituacaoAluno }[]): Contagem {
  const contagem: Contagem = { EM_DIA: 0, VENCENDO: 0, EM_ABERTO: 0, VENCIDO: 0 };
  for (const a of alunos) contagem[a.situacao] += 1;
  return contagem;
}

// /gerenciamento/instrutores: um card por instrutor com quantos alunos
// estão em cada situação. Inativos vão pro fim.
export async function listarInstrutores() {
  if (!(await exigirAdmin())) return [];

  const [instrutores, alunos] = await Promise.all([
    prisma.instrutor.findMany({
      select: {
        id: true,
        nome: true,
        telefone: true,
        ativo: true,
        _count: { select: { planos: { where: { ativo: true } } } },
      },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    }),
    carregarAlunos({ ativo: true }),
  ]);

  return instrutores.map((i) => {
    const deles = alunos.filter((a) => a.instrutorId === i.id);
    return {
      id: i.id,
      nome: i.nome,
      telefone: i.telefone,
      ativo: i.ativo,
      planosAtivos: i._count.planos,
      alunos: deles.length,
      situacoes: contarSituacoes(deles),
    };
  });
}

export type InstrutorLinha = Awaited<ReturnType<typeof listarInstrutores>>[number];

// /gerenciamento/instrutores/[id]: cadastro, planos e todos os alunos
// (ativos e os que saíram) com a situação da mensalidade.
export async function obterInstrutor(id: string) {
  if (!(await exigirAdmin())) return null;

  const instrutor = await prisma.instrutor.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      telefone: true,
      ativo: true,
      planos: {
        select: { id: true, nome: true, precoCentavos: true, duracaoDias: true, ativo: true },
        orderBy: [{ ativo: "desc" }, { precoCentavos: "asc" }],
      },
    },
  });
  if (!instrutor) return null;

  const alunos = await carregarAlunos({ instrutorId: id });
  return {
    instrutor,
    alunos: alunos.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      validoAte: a.validoAte?.toISOString() ?? null,
      ultimoPagamento: a.ultimoPagamento?.toISOString() ?? null,
    })),
  };
}

export type InstrutorDetalhe = NonNullable<Awaited<ReturnType<typeof obterInstrutor>>>;
export type AlunoLinha = InstrutorDetalhe["alunos"][number];
export type PlanoAulaLinha = InstrutorDetalhe["instrutor"]["planos"][number];

// Dashboard e sidebar: alunos ativos com mensalidade vencendo e em aberto.
export async function contarPendenciasAulas() {
  if (!(await exigirAdmin())) return { vencendo: 0, emAberto: 0 };
  const alunos = await carregarAlunos({ ativo: true, instrutor: { ativo: true } });
  const contagem = contarSituacoes(alunos);
  return { vencendo: contagem.VENCENDO, emAberto: contagem.EM_ABERTO };
}
