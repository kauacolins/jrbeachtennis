"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import {
  salvarInstrutorSchema,
  salvarPlanoAulaSchema,
  type SalvarInstrutorInput,
  type SalvarPlanoAulaInput,
} from "../schema";

type Resultado = { ok: true; id: string } | { ok: false; erro: string };

// Cadastro do instrutor (só admin). Sem exclusão: pra tirar da lista,
// desativa — e só dá com nenhum aluno ativo.
export async function salvarInstrutor(input: SalvarInstrutorInput): Promise<Resultado> {
  if (!(await exigirSomenteAdmin())) return { ok: false, erro: "Só o admin altera instrutores." };

  const parsed = salvarInstrutorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { instrutorId, nome, telefone, ativo } = parsed.data;
  const dados = { nome, telefone: telefone || null, ativo };

  if (instrutorId) {
    if (!ativo) {
      const alunosAtivos = await prisma.aluno.count({ where: { instrutorId, ativo: true } });
      if (alunosAtivos > 0) {
        return { ok: false, erro: "Desative os alunos desse instrutor antes de desativá-lo." };
      }
    }
    const atualizado = await prisma.instrutor.update({ where: { id: instrutorId }, data: dados });
    revalidatePath("/gerenciamento/instrutores");
    return { ok: true, id: atualizado.id };
  }

  const criado = await prisma.instrutor.create({ data: dados });
  revalidatePath("/gerenciamento/instrutores");
  return { ok: true, id: criado.id };
}

// Planos e preços do instrutor (só admin). Preço novo vale só pras
// mensalidades lançadas daqui pra frente (valor congelado).
export async function salvarPlanoAula(input: SalvarPlanoAulaInput): Promise<Resultado> {
  if (!(await exigirSomenteAdmin())) return { ok: false, erro: "Só o admin altera planos e preços." };

  const parsed = salvarPlanoAulaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { planoId, instrutorId, nome, precoCentavos, duracaoDias, ativo } = parsed.data;

  let id: string;
  if (planoId) {
    const plano = await prisma.planoAula.findUnique({ where: { id: planoId } });
    if (!plano || plano.instrutorId !== instrutorId) return { ok: false, erro: "Plano não encontrado." };
    await prisma.planoAula.update({ where: { id: planoId }, data: { nome, precoCentavos, duracaoDias, ativo } });
    id = planoId;
  } else {
    const criado = await prisma.planoAula.create({
      data: { instrutorId, nome, precoCentavos, duracaoDias, ativo },
    });
    id = criado.id;
  }

  revalidatePath(`/gerenciamento/instrutores/${instrutorId}`);
  return { ok: true, id };
}
