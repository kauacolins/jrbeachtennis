"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import type { Prisma } from "@/app/generated/prisma/client";
import { periodoDaRenovacao } from "../regras";
import {
  editarAlunoSchema,
  matricularAlunoSchema,
  registrarPagamentoSchema,
  renovarMensalidadeSchema,
  type EditarAlunoInput,
  type MatricularAlunoInput,
  type RegistrarPagamentoInput,
  type RenovarMensalidadeInput,
} from "../schema";

type Erro = { ok: false; erro: string };

function erroDe(parsed: { error: { issues: { message: string }[] } }): Erro {
  return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
}

function revalidar(instrutorId: string) {
  revalidatePath("/gerenciamento/instrutores");
  revalidatePath(`/gerenciamento/instrutores/${instrutorId}`);
}

// Fim da última mensalidade não cancelada do aluno (paga ou em aberto).
async function validoAteDo(
  tx: Prisma.TransactionClient,
  alunoId: string
): Promise<Date | null> {
  const ultima = await tx.mensalidade.findFirst({
    where: { alunoId, canceladaEm: null },
    orderBy: { fim: "desc" },
    select: { fim: true },
  });
  return ultima?.fim ?? null;
}

// Matricula o cliente com o instrutor e já lança o primeiro mês, pago
// (metodo) ou em aberto (metodo nulo). Quem já foi aluno e saiu volta na
// mesma matrícula.
export async function matricularAluno(
  input: MatricularAlunoInput
): Promise<{ ok: true; fim: string } | Erro> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = matricularAlunoSchema.safeParse(input);
  if (!parsed.success) return erroDe(parsed);
  const { instrutorId, clienteId, planoAulaId, horario, observacao, metodo } = parsed.data;

  const resultado = await prisma.$transaction(async (tx) => {
    const plano = await tx.planoAula.findUnique({
      where: { id: planoAulaId },
      include: { instrutor: { select: { ativo: true } } },
    });
    if (!plano || plano.instrutorId !== instrutorId || !plano.ativo) {
      return { ok: false as const, erro: "Plano indisponível." };
    }
    if (!plano.instrutor.ativo) return { ok: false as const, erro: "Instrutor inativo." };

    const cliente = await tx.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
    if (!cliente) return { ok: false as const, erro: "Cliente não encontrado." };

    const existente = await tx.aluno.findUnique({
      where: { instrutorId_clienteId: { instrutorId, clienteId } },
    });
    if (existente?.ativo) return { ok: false as const, erro: "Essa pessoa já é aluna desse instrutor." };

    const dados = {
      planoAulaId,
      horario: horario || null,
      observacao: observacao || null,
      ativo: true,
    };
    const aluno = existente
      ? await tx.aluno.update({ where: { id: existente.id }, data: dados })
      : await tx.aluno.create({ data: { instrutorId, clienteId, ...dados } });

    const agora = new Date();
    const { inicio, fim } = periodoDaRenovacao(await validoAteDo(tx, aluno.id), plano.duracaoDias, agora);
    await tx.mensalidade.create({
      data: {
        alunoId: aluno.id,
        planoAulaId,
        inicio,
        fim,
        valorCentavos: plano.precoCentavos,
        pago: metodo !== null,
        pagoEm: metodo !== null ? agora : null,
        metodo,
      },
    });
    return { ok: true as const, fim: fim.toISOString() };
  });

  if (resultado.ok) revalidar(instrutorId);
  return resultado;
}

// Troca plano, horário ou observação. Plano novo só vale a partir da
// próxima mensalidade (as lançadas ficam com o valor congelado).
export async function editarAluno(input: EditarAlunoInput): Promise<{ ok: true } | Erro> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = editarAlunoSchema.safeParse(input);
  if (!parsed.success) return erroDe(parsed);
  const { alunoId, planoAulaId, horario, observacao } = parsed.data;

  const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });
  if (!aluno) return { ok: false, erro: "Aluno não encontrado." };
  const plano = await prisma.planoAula.findUnique({ where: { id: planoAulaId } });
  if (!plano || plano.instrutorId !== aluno.instrutorId) return { ok: false, erro: "Plano indisponível." };
  if (!plano.ativo && plano.id !== aluno.planoAulaId) return { ok: false, erro: "Plano indisponível." };

  await prisma.aluno.update({
    where: { id: alunoId },
    data: { planoAulaId, horario: horario || null, observacao: observacao || null },
  });
  revalidar(aluno.instrutorId);
  return { ok: true };
}

// Lança o próximo mês do aluno no preço atual do plano dele. Começa no fim
// do período atual (renovar antes de vencer não perde dias). metodo nulo =
// fica em aberto pra cobrar depois.
export async function renovarMensalidade(
  input: RenovarMensalidadeInput
): Promise<{ ok: true; fim: string } | Erro> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = renovarMensalidadeSchema.safeParse(input);
  if (!parsed.success) return erroDe(parsed);
  const { alunoId, metodo } = parsed.data;

  const resultado = await prisma.$transaction(async (tx) => {
    const aluno = await tx.aluno.findUnique({
      where: { id: alunoId },
      include: { planoAula: true, instrutor: { select: { ativo: true } } },
    });
    if (!aluno || !aluno.ativo) return { ok: false as const, erro: "Aluno não está ativo." };
    if (!aluno.instrutor.ativo) return { ok: false as const, erro: "Instrutor inativo." };

    const agora = new Date();
    const { inicio, fim } = periodoDaRenovacao(
      await validoAteDo(tx, alunoId),
      aluno.planoAula.duracaoDias,
      agora
    );
    await tx.mensalidade.create({
      data: {
        alunoId,
        planoAulaId: aluno.planoAulaId,
        inicio,
        fim,
        valorCentavos: aluno.planoAula.precoCentavos,
        pago: metodo !== null,
        pagoEm: metodo !== null ? agora : null,
        metodo,
      },
    });
    return { ok: true as const, fim: fim.toISOString(), instrutorId: aluno.instrutorId };
  });

  if (!resultado.ok) return resultado;
  revalidar(resultado.instrutorId);
  return { ok: true, fim: resultado.fim };
}

// Recebe tudo que o aluno tem em aberto de uma vez, na mesma forma de pagamento.
export async function registrarPagamento(
  input: RegistrarPagamentoInput
): Promise<{ ok: true; totalCentavos: number } | Erro> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = registrarPagamentoSchema.safeParse(input);
  if (!parsed.success) return erroDe(parsed);
  const { alunoId, metodo } = parsed.data;

  const resultado = await prisma.$transaction(async (tx) => {
    const aluno = await tx.aluno.findUnique({ where: { id: alunoId }, select: { instrutorId: true } });
    if (!aluno) return { ok: false as const, erro: "Aluno não encontrado." };

    const abertas = await tx.mensalidade.findMany({
      where: { alunoId, pago: false, canceladaEm: null },
      select: { id: true, valorCentavos: true },
    });
    if (abertas.length === 0) return { ok: false as const, erro: "Nada em aberto pra esse aluno." };

    await tx.mensalidade.updateMany({
      where: { id: { in: abertas.map((m) => m.id) } },
      data: { pago: true, pagoEm: new Date(), metodo },
    });
    return {
      ok: true as const,
      totalCentavos: abertas.reduce((s, m) => s + m.valorCentavos, 0),
      instrutorId: aluno.instrutorId,
    };
  });

  if (!resultado.ok) return resultado;
  revalidar(resultado.instrutorId);
  return { ok: true, totalCentavos: resultado.totalCentavos };
}

// O aluno saiu: cancela as mensalidades que ainda não começaram e as em
// aberto do período atual (não vai mais ter aula). O mês já pago e as
// dívidas de meses passados ficam como estão.
export async function desativarAluno(alunoId: string): Promise<{ ok: true } | Erro> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });
  if (!aluno || !aluno.ativo) return { ok: false, erro: "Aluno não está ativo." };

  const agora = new Date();
  await prisma.$transaction([
    prisma.mensalidade.updateMany({
      where: {
        alunoId,
        canceladaEm: null,
        OR: [{ inicio: { gt: agora } }, { pago: false, fim: { gt: agora } }],
      },
      data: { canceladaEm: agora },
    }),
    prisma.aluno.update({ where: { id: alunoId }, data: { ativo: false } }),
  ]);

  revalidar(aluno.instrutorId);
  return { ok: true };
}
