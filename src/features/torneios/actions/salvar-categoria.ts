"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import { TIME_ZONE } from "@/lib/constants";
import { salvarCategoriaSchema, type SalvarCategoriaInput } from "../schema";

export type SalvarCategoriaResultado = { ok: true } | { ok: false; erro: string };

// Categoria: modalidade + nome livre + quantos atletas por inscrição (ver
// docs/TORNEIOS.md, "Ideia: torneio genérico"). Nome não repete dentro do
// mesmo torneio (@@unique no schema).
export async function salvarCategoria(input: SalvarCategoriaInput): Promise<SalvarCategoriaResultado> {
  if (!(await exigirSomenteAdmin())) return { ok: false, erro: "Só o admin altera categorias." };

  const parsed = salvarCategoriaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const {
    categoriaId,
    torneioId,
    modalidadeId,
    nome,
    minAtletas,
    maxAtletas,
    valorCentavos,
    vagas,
    inicioPrevisto,
    ordem,
  } = parsed.data;

  const torneio = await prisma.torneio.findUnique({ where: { id: torneioId }, select: { id: true } });
  if (!torneio) return { ok: false, erro: "Torneio não encontrado." };

  const data = {
    torneioId,
    modalidadeId,
    nome,
    minAtletas,
    maxAtletas,
    valorCentavos,
    vagas: vagas ?? null,
    inicioPrevisto: inicioPrevisto ? fromZonedTime(inicioPrevisto, TIME_ZONE) : null,
    ordem,
  };

  try {
    if (categoriaId) {
      await prisma.categoria.update({ where: { id: categoriaId }, data, select: { id: true } });
    } else {
      await prisma.categoria.create({ data, select: { id: true } });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, erro: "Já existe uma categoria com esse nome nesse torneio." };
    }
    throw error;
  }

  revalidatePath(`/gerenciamento/torneios/${torneioId}`);
  return { ok: true };
}
