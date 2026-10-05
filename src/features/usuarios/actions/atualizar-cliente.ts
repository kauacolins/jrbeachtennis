"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { Role } from "@/app/generated/prisma/enums";
import { atualizarClienteSchema, type AtualizarClienteInput } from "../schema";

export type AtualizarClienteResultado = { ok: true } | { ok: false; erro: string };

// Admin corrige nome/e-mail/telefone de um cadastro de cliente (ex.: erro
// de digitação, pedido de correção por telefone) — sem mexer em papel ou
// senha, que não são coisa de cliente (ver atualizarUsuario, a versão
// equivalente pra conta de equipe).
export async function atualizarCliente(
  input: AtualizarClienteInput
): Promise<AtualizarClienteResultado> {
  if (!(await exigirAdmin())) {
    return { ok: false, erro: "Sem permissão." };
  }

  const parsed = atualizarClienteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { usuarioId, nome, email, telefone } = parsed.data;

  const usuario = await prisma.user.findUnique({ where: { id: usuarioId } });
  if (!usuario || usuario.removidoEm || usuario.role !== Role.CLIENT) {
    return { ok: false, erro: "Cliente não encontrado." };
  }

  const emailEmUso = await prisma.user.findUnique({ where: { email } });
  if (emailEmUso && emailEmUso.id !== usuarioId) {
    return { ok: false, erro: "Já existe uma conta com esse e-mail." };
  }

  await prisma.user.update({
    where: { id: usuarioId },
    data: { name: nome, email, telefone: telefone || null },
  });

  revalidatePath("/gerenciamento/equipe/clientes");
  return { ok: true };
}
