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
import { fecharComandas } from "@/features/comandas/actions/fechar-comanda";
import type { ComandaResumo } from "@/features/comandas/actions/listar-comandas";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";

// Fecha as comandas selecionadas no painel com uma forma de pagamento só.
// Mesmas regras do fechamento de uma (RF34/RF38), aplicadas a cada uma.
export function FecharComandasDialog({
  aberto,
  onOpenChange,
  comandas,
  onFechadas,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  comandas: ComandaResumo[];
  onFechadas: () => void;
}) {
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [fechando, startTransition] = useTransition();

  useEffect(() => {
    if (aberto) setMetodo(null);
  }, [aberto]);

  const total = comandas.reduce((soma, c) => soma + c.totalCentavos, 0);
  const rotulo = `${comandas.length} ${comandas.length === 1 ? "comanda" : "comandas"}`;

  function fechar() {
    if (!metodo) return;
    startTransition(async () => {
      const resultado = await fecharComandas({ comandaIds: comandas.map((c) => c.id), metodo });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(
        `${resultado.quantidade} ${resultado.quantidade === 1 ? "comanda fechada" : "comandas fechadas"}: ${formatarPreco(resultado.totalCentavos)}.`
      );
      onOpenChange(false);
      onFechadas();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Fechar {rotulo}</DialogTitle>
          <DialogDescription>Todas recebidas com a mesma forma de pagamento.</DialogDescription>
        </DialogHeader>

        <ul className="flex max-h-40 flex-col divide-y overflow-y-auto rounded-lg border text-sm">
          {comandas.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="truncate">{c.nome}</span>
              <span className="shrink-0 tabular-nums">{formatarPreco(c.totalCentavos)}</span>
            </li>
          ))}
        </ul>

        <p className="text-center text-3xl font-semibold tabular-nums">{formatarPreco(total)}</p>

        <SeletorMetodo valor={metodo} onChange={setMetodo} />

        <DialogFooter>
          <Button className="h-11 w-full" disabled={!metodo || fechando} onClick={fechar}>
            {fechando ? "Fechando…" : `Confirmar pagamento de ${rotulo}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
