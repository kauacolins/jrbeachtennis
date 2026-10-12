"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { adicionarItemBar, diminuirItemBar, removerItem } from "../regras";

type Resultado = { ok: true } | { ok: false; erro: string };

function revalidar() {
  revalidatePath("/gerenciamento/comandas");
  revalidatePath("/gerenciamento/day-use");
}

// RF33: lançar produto do bar com um toque (soma 1 se já estiver lançado).
export async function lancarProdutoBar(comandaId: string, produtoId: string): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };
  const resultado = await prisma.$transaction((tx) =>
    adicionarItemBar(tx, { comandaId, produtoId })
  );
  if (resultado.ok) revalidar();
  return resultado;
}

export async function diminuirItem(itemId: string): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };
  const resultado = await prisma.$transaction((tx) => diminuirItemBar(tx, itemId));
  if (resultado.ok) revalidar();
  return resultado;
}

// Regra 3: item errado sai enquanto a comanda está aberta. Day use cancela o
// passe; reserva só sai da comanda.
export async function removerItemComanda(itemId: string): Promise<Resultado> {
  if (!(await exigirAdmin())) return { ok: false, erro: "Sem permissão." };
  const resultado = await prisma.$transaction((tx) => removerItem(tx, itemId, new Date()));
  if (resultado.ok) {
    revalidar();
    revalidatePath("/gerenciamento/agenda");
  }
  return resultado;
}
