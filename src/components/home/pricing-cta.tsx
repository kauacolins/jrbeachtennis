"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { TipoProduto } from "@/lib/mock-data";

export function PricingCta({
  tipo,
  destaque,
}: {
  tipo: TipoProduto;
  destaque: boolean;
}) {
  if (tipo === "DIARIA") {
    return (
      <Button
        className="h-11 w-full"
        variant={destaque ? "default" : "outline"}
        render={<a href="#modalidades" />}
        nativeButton={false}
      >
        Reservar horário
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className="h-11 w-full"
      variant={destaque ? "default" : "outline"}
      onClick={() =>
        toast(
          tipo === "MENSAL"
            ? "Assinatura do mensal chega em breve — fale com a recepção."
            : "Compra de day use online chega em breve — fale com a recepção."
        )
      }
    >
      {tipo === "MENSAL" ? "Assinar mensal" : "Comprar day use"}
    </Button>
  );
}
