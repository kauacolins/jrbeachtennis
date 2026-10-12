"use client";

import { Banknote, CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { METODOS_PAGAMENTO } from "@/lib/pagamento";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";

const ICONES: Record<MetodoPagamento, typeof Banknote> = {
  PIX: QrCode,
  DINHEIRO: Banknote,
  CARTAO_DEBITO: CreditCard,
  CARTAO_CREDITO: CreditCard,
};

// Forma de pagamento no balcão: quatro botões grandes, um toque.
export function SeletorMetodo({
  valor,
  onChange,
}: {
  valor: MetodoPagamento | null;
  onChange: (metodo: MetodoPagamento) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-2 gap-2">
      {METODOS_PAGAMENTO.map(({ valor: metodo, label }) => {
        const Icone = ICONES[metodo];
        const ativo = valor === metodo;
        return (
          <button
            key={metodo}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(metodo)}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              ativo
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <Icone className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
