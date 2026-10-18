"use server";

import { prisma } from "@/lib/prisma";

// Banner da home (docs/TORNEIOS.md): só torneio não-rascunho/cancelado, com
// destaqueHome marcado e banner, dentro do prazo (destaqueAte, ou o fim do
// torneio se vazio — soma 1 dia porque dataFim é só a data, sem hora).
// Ordenado pela data do torneio.
export async function listarTorneiosDestacados() {
  const agora = new Date();
  const candidatos = await prisma.torneio.findMany({
    where: {
      destaqueHome: true,
      bannerUrl: { not: null },
      status: { notIn: ["RASCUNHO", "CANCELADO"] },
    },
    orderBy: { dataInicio: "asc" },
    select: {
      id: true,
      slug: true,
      nome: true,
      bannerUrl: true,
      dataFim: true,
      destaqueAte: true,
    },
  });

  return candidatos.filter((torneio) => {
    const limite = torneio.destaqueAte ?? new Date(torneio.dataFim.getTime() + 24 * 60 * 60 * 1000);
    return agora <= limite;
  });
}

export type TorneioDestacado = Awaited<ReturnType<typeof listarTorneiosDestacados>>[number];
