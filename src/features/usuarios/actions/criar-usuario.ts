"use server";

import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { criarUsuarioSchema, type CriarUsuarioInput } from "../schema";

export type CriarUsuarioResultado = { ok: true; usuarioId: string } | { ok: false; erro: string };

// Cadastro de conta de equipe (admin/operador/instrutor) pelo próprio admin.
// Cria User + Account (provider "credential") direto via Prisma, no mesmo
// formato que o Better Auth usa — evita chamar auth.api.signUpEmail, que
// trocaria o cookie de sessão de quem está logado (o admin) pelo do usuário
// recém-criado.
export async function criarUsuario(
  input: CriarUsuarioInput
): Promise<CriarUsuarioResultado> {
  if (!(await exigirAdmin())) {
    return { ok: false, erro: "Sem permissão." };
  }

  const parsed = criarUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { nome, email, telefone, senha, role } = parsed.data;

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return { ok: false, erro: "Já existe uma conta com esse e-mail." };
  }

  const senhaHash = await hashPassword(senha);

  const usuario = await prisma.$transaction(async (tx) => {
    const criado = await tx.user.create({
      data: {
        name: nome,
        email,
        telefone: telefone || null,
        role,
        emailVerified: true,
      },
    });
    await tx.account.create({
      data: {
        userId: criado.id,
        accountId: criado.id,
        providerId: "credential",
        password: senhaHash,
      },
    });
    return criado;
  });

  revalidatePath("/gerenciamento/equipe");
  return { ok: true, usuarioId: usuario.id };
}
