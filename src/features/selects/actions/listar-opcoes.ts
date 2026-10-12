"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";

// Opções ativas de um SelectGroup, na ordem cadastrada.
export async function listarOpcoes(chave: string): Promise<string[]> {
  if (!(await exigirAdmin())) return [];
  const opcoes = await prisma.selectOption.findMany({
    where: { ativo: true, grupo: { chave } },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    select: { nome: true },
  });
  return opcoes.map((o) => o.nome);
}
