import type { MetodoPagamento } from "@/app/generated/prisma/enums";

// Pagamento no local (balcão): o operador só registra como foi pago.
export const METODOS_PAGAMENTO: { valor: MetodoPagamento; label: string }[] = [
  { valor: "PIX", label: "Pix" },
  { valor: "DINHEIRO", label: "Dinheiro" },
  { valor: "CARTAO_DEBITO", label: "Débito" },
  { valor: "CARTAO_CREDITO", label: "Crédito" },
];

export function rotuloMetodo(metodo: MetodoPagamento | null | undefined) {
  return METODOS_PAGAMENTO.find((m) => m.valor === metodo)?.label ?? "—";
}
