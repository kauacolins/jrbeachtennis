"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessaoAtual } from "@/lib/get-session";
import { inscrever as inscreverTx } from "../regras";
import { inscreverSchema, type InscreverInput } from "../schema";

export type InscreverResultado = { ok: true; inscricaoId: string } | { ok: false; erro: string };

// Inscrição pelo site: só cliente logado (ver docs/TORNEIOS.md — quem
// inscreve entra como o primeiro atleta). Os demais (dupla, time) não
// precisam ter conta.
export async function inscrever(input: InscreverInput): Promise<InscreverResultado> {
  const sessao = await getSessaoAtual();
  if (!sessao?.user) return { ok: false, erro: "Entre na sua conta para se inscrever." };

  const parsed = inscreverSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { categoriaId, nomeEquipe, atletas } = parsed.data;

  const [primeiro, ...resto] = atletas;
  const atletasComConta = [{ ...primeiro, userId: sessao.user.id }, ...resto];

  const resultado = await prisma.$transaction((tx) =>
    inscreverTx(tx, {
      categoriaId,
      criadaPorId: sessao.user.id,
      nomeEquipe,
      atletas: atletasComConta,
      agora: new Date(),
    })
  );

  if (resultado.ok) {
    revalidatePath("/minhas-inscricoes");
    revalidatePath("/torneios", "layout"); // vagas mudam em /torneios/[slug]
  }
  return resultado;
}
