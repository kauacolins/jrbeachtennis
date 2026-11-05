import type { MetodoPagamento } from "@/app/generated/prisma/enums";

// Regras de situação do aluno (docs/INSTRUTORES.md). Mesmo espírito do
// mensal (RN11), com um caso a mais: a mensalidade pode estar em aberto.

export const DIA_MS = 24 * 60 * 60_000;
export const DIAS_AVISO_VENCIMENTO = 7;

export type SituacaoAluno = "EM_ABERTO" | "VENCIDO" | "VENCENDO" | "EM_DIA";

export interface MensalidadeResumo {
  inicio: Date;
  fim: Date;
  valorCentavos: number;
  pago: boolean;
  pagoEm: Date | null;
  metodo: MetodoPagamento | null;
  canceladaEm: Date | null;
}

/**
 * - validoAte: fim da última mensalidade não cancelada (paga ou não);
 * - emAberto: soma das mensalidades não canceladas e não pagas;
 * - situação: em aberto vence tudo (tem cobrança a fazer); sem período
 *   vigente é vencido; vigente com até 7 dias é "vencendo"; o resto em dia.
 */
export function resumirMensalidades(mensalidades: MensalidadeResumo[], agora = new Date()) {
  const validas = mensalidades.filter((m) => !m.canceladaEm);
  const validoAte = validas.reduce<Date | null>((maior, m) => (!maior || m.fim > maior ? m.fim : maior), null);
  const abertas = validas.filter((m) => !m.pago);
  const emAbertoCentavos = abertas.reduce((soma, m) => soma + m.valorCentavos, 0);
  const ultimoPago = validas.reduce<MensalidadeResumo | null>(
    (maior, m) => (m.pagoEm && (!maior?.pagoEm || m.pagoEm > maior.pagoEm) ? m : maior),
    null
  );

  const vigente = validoAte !== null && validoAte > agora;
  const limiteAviso = new Date(agora.getTime() + DIAS_AVISO_VENCIMENTO * DIA_MS);

  let situacao: SituacaoAluno;
  if (emAbertoCentavos > 0) situacao = "EM_ABERTO";
  else if (!vigente) situacao = "VENCIDO";
  else if (validoAte <= limiteAviso) situacao = "VENCENDO";
  else situacao = "EM_DIA";

  return {
    situacao,
    vigente,
    validoAte,
    emAbertoCentavos,
    mesesEmAberto: abertas.length,
    ultimoPagamento: ultimoPago?.pagoEm ?? null,
    ultimoMetodo: ultimoPago?.metodo ?? null,
    // Dias inteiros até vencer (negativo = já venceu).
    diasRestantes: validoAte ? Math.ceil((validoAte.getTime() - agora.getTime()) / DIA_MS) : null,
  };
}

/** Renovar começa no fim do período atual (não perde dias); sem período vigente, começa agora. */
export function periodoDaRenovacao(validoAte: Date | null, duracaoDias: number, agora = new Date()) {
  const inicio = validoAte && validoAte > agora ? validoAte : agora;
  return { inicio, fim: new Date(inicio.getTime() + duracaoDias * DIA_MS) };
}
