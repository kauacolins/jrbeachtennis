"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import type { ClienteBalcao } from "./buscar-clientes";
import { criarClienteSchema, type CriarClienteInput } from "../schema";

export type CriarClienteResultado =
  | { ok: true; cliente: ClienteBalcao }
  | { ok: false; erro: string };

// Cadastro simplificado do balcão (nome, sobrenome e, se tiver, telefone).
// Se já existe conta no site com esse telefone, já liga as duas.
export async function criarCliente(input: CriarClienteInput): Promise<CriarClienteResultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };

  const parsed = criarClienteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const nome = `${parsed.data.nome} ${parsed.data.sobrenome}`.replace(/\s+/g, " ");
  const telefone = parsed.data.telefone || null;

  let conta: { id: string } | null = null;
  if (telefone) {
    const existente = await prisma.cliente.findUnique({ where: { telefone } });
    if (existente) {
      return {
        ok: false,
        erro: `Esse telefone já está cadastrado para ${existente.nome}. Busque pelo nome.`,
      };
    }
    conta = await prisma.user.findFirst({
      where: { telefone, removidoEm: null, cliente: null },
      select: { id: true },
    });
  }

  const cliente = await prisma.cliente.create({
    data: { nome, telefone, userId: conta?.id ?? null },
  });

  return {
    ok: true,
    cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, planoAteISO: null },
  };
}
