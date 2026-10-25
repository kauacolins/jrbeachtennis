"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { dataParaISO } from "@/lib/format";
import { obterModeloEvento, type ParametroModelo, type ValoresEvento } from "../modelos";

export type OpcaoModelo = { id: string; nome: string };

type Resultado =
  | { tipo: "valores"; nomeModelo: string; valores: ValoresEvento }
  | { tipo: "escolher"; nomeModelo: string; parametro: ParametroModelo; opcoes: OpcaoModelo[] };

async function listarOpcoes(parametro: ParametroModelo): Promise<OpcaoModelo[]> {
  if (parametro === "modalidade") {
    return prisma.modalidade.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } });
  }
  return prisma.quadra.findMany({
    where: { ativa: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
}

// Monta os valores iniciais da tela de cadastro a partir de uma sugestão
// (ver MODELOS_EVENTO). Se o modelo precisa de uma escolha (modalidade,
// quadra) e ela não veio na URL, devolve as opções pra tela perguntar antes.
export async function prepararModeloEvento(
  modeloId: string | undefined,
  opcaoId: string | undefined
): Promise<Resultado | null> {
  if (!(await exigirAdmin())) return null;
  const modelo = obterModeloEvento(modeloId);
  if (!modelo) return null;

  let opcao = "";
  if (modelo.parametro) {
    const opcoes = await listarOpcoes(modelo.parametro);
    const escolhida = opcoes.find((o) => o.id === opcaoId);
    if (!escolhida) {
      return { tipo: "escolher", nomeModelo: modelo.nome, parametro: modelo.parametro, opcoes };
    }
    opcao = escolhida.nome;
  }

  const dayUse = modelo.id === "day-use"
    ? await prisma.produto.findUnique({ where: { tipo: "DAY_USE" }, select: { precoCentavos: true } })
    : null;

  return {
    tipo: "valores",
    nomeModelo: modelo.nome,
    valores: modelo.valores({
      hojeISO: dataParaISO(new Date()),
      precoDayUseCentavos: dayUse?.precoCentavos ?? null,
      opcao,
    }),
  };
}
