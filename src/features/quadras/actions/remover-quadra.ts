"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { exigirAdmin } from "@/lib/require-admin";

export type RemoverQuadraResultado = { ok: true } | { ok: false; erro: string };

// RF10: excluir quadra. Bloqueada pelo banco (RESTRICT) se já tiver
// horário, bloqueio ou reserva — nesses casos, melhor desativar (ativa=false).
export async function removerQuadra(quadraId: string): Promise<RemoverQuadraResultado> {
  if (!(await exigirAdmin())) {
    return { ok: false, erro: "Sem permissão." };
  }

  try {
    await prisma.quadra.delete({ where: { id: quadraId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        ok: false,
        erro:
          "Essa quadra já tem horário, bloqueio ou reserva cadastrados. Desative em vez de excluir.",
      };
    }
    throw error;
  }

  revalidatePath("/gerenciamento/configuracoes/quadras");
  revalidatePath("/gerenciamento/horarios");
  revalidatePath("/gerenciamento/bloqueios");
  revalidatePath("/gerenciamento");
  return { ok: true };
}
