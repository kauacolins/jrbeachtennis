import type { StatusInscricao, StatusTorneio } from "@/app/generated/prisma/enums";

export const STATUS_TORNEIO: { valor: StatusTorneio; label: string }[] = [
  { valor: "RASCUNHO", label: "Rascunho" },
  { valor: "INSCRICOES_ABERTAS", label: "Inscrições abertas" },
  { valor: "INSCRICOES_ENCERRADAS", label: "Inscrições encerradas" },
  { valor: "EM_ANDAMENTO", label: "Em andamento" },
  { valor: "FINALIZADO", label: "Finalizado" },
  { valor: "CANCELADO", label: "Cancelado" },
];

export function rotuloStatusTorneio(status: StatusTorneio) {
  return STATUS_TORNEIO.find((s) => s.valor === status)?.label ?? status;
}

export const STATUS_INSCRICAO: { valor: StatusInscricao; label: string }[] = [
  { valor: "PENDENTE", label: "Aguardando pagamento" },
  { valor: "CONFIRMADA", label: "Paga" },
  { valor: "CANCELADA", label: "Cancelada" },
];

export function rotuloStatusInscricao(status: StatusInscricao) {
  return STATUS_INSCRICAO.find((s) => s.valor === status)?.label ?? status;
}
