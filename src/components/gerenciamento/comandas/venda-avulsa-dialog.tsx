"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SeletorMetodo } from "@/components/gerenciamento/balcao/seletor-metodo";
import { formatarPreco } from "@/lib/format";
import { venderAvulso } from "@/features/comandas/actions/vender-avulso";
import type { ItemPedidoInput } from "@/features/comandas/schema";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";

// RF39: sem abrir comanda com nome, recebe e fecha na hora — pro cliente de
// balcão que só quer uma água e ir embora.
export function VendaAvulsaDialog({
  aberto,
  onOpenChange,
  itens,
  resumo,
  totalCentavos,
  onVendida,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  itens: ItemPedidoInput[];
  resumo: string;
  totalCentavos: number;
  onVendida: () => void;
}) {
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [vendendo, startTransition] = useTransition();

  useEffect(() => {
    if (aberto) setMetodo(null);
  }, [aberto]);

  function vender() {
    if (!metodo) return;
    startTransition(async () => {
      const resultado = await venderAvulso({ itens, metodo });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(`Venda avulsa recebida: ${formatarPreco(resultado.totalCentavos)}.`);
      onOpenChange(false);
      onVendida();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Venda avulsa</DialogTitle>
          <DialogDescription>{resumo}</DialogDescription>
        </DialogHeader>

        <p className="text-center text-3xl font-semibold tabular-nums">
          {formatarPreco(totalCentavos)}
        </p>

        <SeletorMetodo valor={metodo} onChange={setMetodo} />

        <DialogFooter>
          <Button className="h-11 w-full" disabled={!metodo || vendendo} onClick={vender}>
            {vendendo ? "Recebendo…" : "Confirmar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
