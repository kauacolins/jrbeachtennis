import type { Prisma } from "@/app/generated/prisma/client";

type Tx = Prisma.TransactionClient;

// RN11: plano ativo = pago, não cancelado e dentro da validade.
export function planoAtivoEm(tx: Tx, clienteId: string, instante: Date) {
  return tx.assinatura.findFirst({
    where: {
      clienteId,
      pago: true,
      canceladaEm: null,
      inicio: { lte: instante },
      fim: { gt: instante },
    },
    orderBy: { fim: "desc" },
  });
}

export type CriarPasseResultado =
  | {
      ok: true;
      passe: { id: string; valorCentavos: number; cobertoPeloPlano: boolean };
    }
  | { ok: false; erro: string };

// RN10: um passe por cliente por data; com limite diário, bloqueia quando
// lota; com mensal ativo, sai por R$ 0 já pago e ligado ao plano. Precisa
// rodar dentro de uma transação — a trava na linha do Produto serializa
// lançamentos simultâneos pra não estourar o limite.
export async function criarPasseDayUse(
  tx: Tx,
  { clienteId, dataISO, agora }: { clienteId: string; dataISO: string; agora: Date }
): Promise<CriarPasseResultado> {
  const [produto] = await tx.$queryRaw<
    { id: string; precoCentavos: number; limiteDiario: number | null; ativo: boolean }[]
  >`SELECT "id", "precoCentavos", "limiteDiario", "ativo" FROM "Produto" WHERE "tipo" = 'DAY_USE' FOR UPDATE`;
  if (!produto || !produto.ativo) {
    return { ok: false, erro: "Day use indisponível no momento." };
  }

  const jaTem = await tx.passeDayUse.findFirst({
    where: { clienteId, data: dataISO, canceladoEm: null },
    select: { id: true },
  });
  if (jaTem) {
    return { ok: false, erro: "Essa pessoa já tem day use hoje." };
  }

  if (produto.limiteDiario !== null) {
    const ocupados = await tx.passeDayUse.count({
      where: { data: dataISO, canceladoEm: null },
    });
    if (ocupados >= produto.limiteDiario) {
      return { ok: false, erro: `Day use lotado hoje (${produto.limiteDiario} pessoas).` };
    }
  }

  const plano = await planoAtivoEm(tx, clienteId, agora);

  const passe = await tx.passeDayUse.create({
    data: {
      produtoId: produto.id,
      clienteId,
      data: dataISO,
      valorCentavos: plano ? 0 : produto.precoCentavos,
      assinaturaId: plano?.id ?? null,
      pago: Boolean(plano),
      pagoEm: plano ? agora : null,
    },
  });

  return {
    ok: true,
    passe: { id: passe.id, valorCentavos: passe.valorCentavos, cobertoPeloPlano: Boolean(plano) },
  };
}
