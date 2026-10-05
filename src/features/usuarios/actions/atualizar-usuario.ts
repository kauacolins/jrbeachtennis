"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { Role } from "@/app/generated/prisma/enums";
import { atualizarUsuarioSchema, type AtualizarUsuarioInput } from "../schema";

export type AtualizarUsuarioResultado = { ok: true } | { ok: false; erro: string };

// Edita dados + papel de uma conta de equipe. Admin não pode tirar o próprio
// acesso de admin por aqui — evita se trancar fora do /gerenciamento.
export async function atualizarUsuario(
  input: AtualizarUsuarioInput
): Promise<AtualizarUsuarioResultado> {
  const admin = await exigirAdmin();
  if (!admin) {
    return { ok: false, erro: "Sem permissão." };
  }

  const parsed = atualizarUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { usuarioId, nome, email, telefone, role } = parsed.data;

  if (admin.id === usuarioId && role !== Role.ADMIN) {
    return { ok: false, erro: "Você não pode remover seu próprio acesso de admin." };
  }

  const usuario = await prisma.user.findUnique({ where: { id: usuarioId } });
  if (!usuario || usuario.removidoEm) {
    return { ok: false, erro: "Usuário não encontrado." };
  }

  const emailEmUso = await prisma.user.findUnique({ where: { email } });
  if (emailEmUso && emailEmUso.id !== usuarioId) {
    return { ok: false, erro: "Já existe uma conta com esse e-mail." };
  }

  await prisma.user.update({
    where: { id: usuarioId },
    data: { name: nome, email, telefone: telefone || null, role },
  });

  revalidatePath("/gerenciamento/equipe");
  return { ok: true };
}
