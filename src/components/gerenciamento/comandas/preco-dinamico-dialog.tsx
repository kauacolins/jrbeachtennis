"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarPreco } from "@/lib/format";
import { PRECO_DINAMICO_MAXIMO_CENTAVOS } from "@/lib/comanda";

function reaisParaCentavos(valor: string) {
  const centavos = Math.round(Number(valor.replace(",", ".")) * 100);
  return Number.isFinite(centavos) ? centavos : null;
}

// Produto de preço dinâmico (picolé): o operador digita o valor da unidade
// a cada lançamento, em vez de cadastrar uma variante por preço. Abre vazio.
export function PrecoDinamicoDialog({
  produto,
  onOpenChange,
  onConfirmar,
}: {
  produto: { nome: string } | null;
  onOpenChange: (aberto: boolean) => void;
  onConfirmar: (precoCentavos: number) => void;
}) {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!produto) return;
    setValor("");
    setErro(null);
  }, [produto]);

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    const centavos = reaisParaCentavos(valor);
    if (centavos === null || centavos < 1) {
      setErro("Informe o valor.");
      return;
    }
    if (centavos > PRECO_DINAMICO_MAXIMO_CENTAVOS) {
      setErro(`O valor máximo é ${formatarPreco(PRECO_DINAMICO_MAXIMO_CENTAVOS)}.`);
      return;
    }
    onConfirmar(centavos);
    onOpenChange(false);
  }

  return (
    <Dialog open={produto !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{produto?.nome}</DialogTitle>
          <DialogDescription>Digite o valor da unidade.</DialogDescription>
        </DialogHeader>
        <form onSubmit={confirmar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preco-dinamico">Valor (R$)</Label>
            <Input
              id="preco-dinamico"
              type="number"
              inputMode="decimal"
              min="0.01"
              max={PRECO_DINAMICO_MAXIMO_CENTAVOS / 100}
              step="0.01"
              autoFocus
              autoComplete="off"
              placeholder="0,00"
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                setErro(null);
              }}
              aria-invalid={erro !== null}
              aria-describedby={erro ? "preco-dinamico-erro" : undefined}
              className="h-11 text-lg tabular-nums"
            />
            {erro && (
              <p id="preco-dinamico-erro" className="text-sm text-destructive" aria-live="polite">
                {erro}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" className="h-11">
              Lançar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
