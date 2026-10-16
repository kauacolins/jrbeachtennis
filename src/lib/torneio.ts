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

// Cor do badge de situação nas listagens do admin (torneios e visão geral).
export function variantePorStatusTorneio(status: StatusTorneio) {
  if (status === "CANCELADO") return "destructive" as const;
  if (status === "RASCUNHO" || status === "INSCRICOES_ENCERRADAS") return "outline" as const;
  return "secondary" as const;
}

type JanelaInscricao = {
  status: StatusTorneio;
  inscricoesAbrem: Date;
  inscricoesFecham: Date;
};

// Status do torneio por si só não garante que a inscrição está de fato
// aberta agora — o admin marca INSCRICOES_ABERTAS mas a janela
// (inscricoesAbrem/inscricoesFecham) é quem decide. Usado na listagem e na
// página do torneio pra não divergir.
export function estaComInscricoesAbertas(torneio: JanelaInscricao, agora = new Date()) {
  return (
    torneio.status === "INSCRICOES_ABERTAS" &&
    agora >= torneio.inscricoesAbrem &&
    agora < torneio.inscricoesFecham
  );
}

// Badge da listagem pública: diferencia "aberto agora" de "vai abrir" em
// vez de só repetir o rótulo cru do status.
export function infoStatusTorneioPublico(
  torneio: JanelaInscricao,
  agora = new Date()
): { label: string; className: string } {
  if (estaComInscricoesAbertas(torneio, agora)) {
    return { label: "Inscrições abertas", className: "bg-accent text-accent-foreground" };
  }
  if (torneio.status === "INSCRICOES_ABERTAS" && agora < torneio.inscricoesAbrem) {
    return { label: "Em breve", className: "bg-warning text-warning-foreground" };
  }
  if (torneio.status === "EM_ANDAMENTO") {
    return { label: "Em andamento", className: "bg-secondary text-secondary-foreground" };
  }
  return { label: rotuloStatusTorneio(torneio.status), className: "bg-muted text-muted-foreground" };
}

export const STATUS_INSCRICAO: { valor: StatusInscricao; label: string }[] = [
  { valor: "PENDENTE", label: "Aguardando pagamento" },
  { valor: "CONFIRMADA", label: "Paga" },
  { valor: "CANCELADA", label: "Cancelada" },
];

export function rotuloStatusInscricao(status: StatusInscricao) {
  return STATUS_INSCRICAO.find((s) => s.valor === status)?.label ?? status;
}

// Cor do badge de inscrição (docs/DESIGN_SYSTEM.md): paga usa accent,
// aguardando pagamento usa warning, cancelada usa muted.
export function classeStatusInscricao(status: StatusInscricao) {
  if (status === "CONFIRMADA") return "bg-accent text-accent-foreground";
  if (status === "PENDENTE") return "bg-warning text-warning-foreground";
  return "bg-muted text-muted-foreground";
}
