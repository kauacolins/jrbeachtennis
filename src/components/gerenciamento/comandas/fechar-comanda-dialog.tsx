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
import { fecharComanda } from "@/features/comandas/actions/fechar-comanda";
import type { ComandaDetalhe } from "@/features/comandas/actions/listar-comandas";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";

// RF34: mostra o total, o operador recebe, marca a forma e fecha. Day use e
// reserva da comanda ficam pagos junto (RF38).
export function FecharComandaDialog({
  aberto,
  onOpenChange,
  comanda,
  onFechada,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  comanda: ComandaDetalhe;
  onFechada: () => void;
}) {
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [fechando, startTransition] = useTransition();

  useEffect(() => {
    if (aberto) setMetodo(null);
  }, [aberto]);

  function fechar() {
    if (!metodo) return;
    startTransition(async () => {
      const resultado = await fecharComanda({ comandaId: comanda.id, metodo });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(`Comanda de ${comanda.nome} fechada: ${formatarPreco(resultado.totalCentavos)}.`);
      onOpenChange(false);
      onFechada();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Receber de {comanda.nome}</DialogTitle>
          <DialogDescription>
            {comanda.itens.length} {comanda.itens.length === 1 ? "item" : "itens"} na comanda.
          </DialogDescription>
        </DialogHeader>

        <p className="text-center text-3xl font-semibold tabular-nums">
          {formatarPreco(comanda.totalCentavos)}
        </p>

        <SeletorMetodo valor={metodo} onChange={setMetodo} />

        <DialogFooter>
          <Button className="h-11 w-full" disabled={!metodo || fechando} onClick={fechar}>
            {fechando ? "Fechando…" : "Confirmar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
