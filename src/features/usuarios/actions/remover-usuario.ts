"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";

export type RemoverUsuarioResultado = { ok: true } | { ok: false; erro: string };

// Soft delete: marca removidoEm e encerra as sessões ativas, mas mantém a
// linha (reservas, sessões antigas etc. continuam referenciando o usuário).
// Admin não pode remover a própria conta.
export async function removerUsuario(usuarioId: string): Promise<RemoverUsuarioResultado> {
  const admin = await exigirAdmin();
  if (!admin) {
    return { ok: false, erro: "Sem permissão." };
  }
  if (admin.id === usuarioId) {
    return { ok: false, erro: "Você não pode excluir a própria conta." };
  }

  const usuario = await prisma.user.findUnique({ where: { id: usuarioId } });
  if (!usuario || usuario.removidoEm) {
    return { ok: false, erro: "Usuário não encontrado." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: usuarioId }, data: { removidoEm: new Date() } }),
    prisma.session.deleteMany({ where: { userId: usuarioId } }),
  ]);

  revalidatePath("/gerenciamento/equipe");
  return { ok: true };
}
