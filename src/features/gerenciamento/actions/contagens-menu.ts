"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { listarPlanos } from "@/features/planos/actions/planos";

// Badges da sidebar (admin-panel-ui): só o que pede ação — comandas
// abertas, mensalistas vencendo e inscrições de torneio sem pagamento.
// Chave = href do item do menu.
export async function obterContagensMenu(): Promise<Record<string, number>> {
  if (!(await exigirAdmin())) return {};

  const [comandas, mensais, inscricoes] = await Promise.all([
    prisma.comanda.count({ where: { status: "ABERTA" } }),
    listarPlanos("vencendo").then((planos) => planos.length),
    prisma.inscricao.count({ where: { status: "PENDENTE" } }),
  ]);

  return {
    "/gerenciamento/comandas": comandas,
    "/gerenciamento/planos": mensais,
    "/gerenciamento/torneios": inscricoes,
  };
}
