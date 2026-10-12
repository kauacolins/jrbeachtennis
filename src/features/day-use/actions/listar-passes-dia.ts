"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";

// RF18: lista de day use do dia. O passe nasce no balcão com a pessoa já na
// arena (via comanda), então estar na lista já é a presença.
export async function listarPassesDoDia(dataISO: string) {
  if (!(await exigirAdmin())) return null;

  const [passes, produto] = await Promise.all([
    prisma.passeDayUse.findMany({
      where: { data: dataISO },
      include: {
        cliente: { select: { nome: true, telefone: true } },
        itemComanda: { select: { comanda: { select: { id: true, nome: true, status: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.produto.findUnique({ where: { tipo: "DAY_USE" } }),
  ]);

  const ativos = passes.filter((p) => !p.canceladoEm);

  return {
    limiteDiario: produto?.limiteDiario ?? null,
    totalAtivos: ativos.length,
    passes: passes.map((p) => ({
      id: p.id,
      nome: p.cliente.nome,
      telefone: p.cliente.telefone,
      entradaEm: p.createdAt.toISOString(),
      valorCentavos: p.valorCentavos,
      cobertoPeloPlano: Boolean(p.assinaturaId),
      pago: p.pago,
      metodo: p.metodo,
      cancelado: Boolean(p.canceladoEm),
      comanda: p.itemComanda?.comanda ?? null,
    })),
  };
}

export type PassesDoDia = NonNullable<Awaited<ReturnType<typeof listarPassesDoDia>>>;
