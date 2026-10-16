// Cor por status de reserva (docs/DESIGN_SYSTEM.md): confirmada/concluída
// usam accent, pendente usa warning, cancelada usa muted — nunca limão
// (reservado pra uma única ação primária por tela). Usado na agenda do dia
// (reservas-dia-lista) e no painel de detalhe (reserva-detalhe-painel).
export const STATUS_RESERVA_INFO: Record<string, { label: string; className: string }> = {
  PENDENTE_PAGAMENTO: {
    label: "Aguardando Pix",
    className: "bg-warning text-warning-foreground",
  },
  CONFIRMADA: { label: "Confirmada", className: "bg-accent text-accent-foreground" },
  CONCLUIDA: { label: "Concluída", className: "bg-accent text-accent-foreground" },
  NAO_COMPARECEU: {
    label: "Não compareceu",
    className: "bg-destructive/10 text-destructive",
  },
  CANCELADA: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
};
