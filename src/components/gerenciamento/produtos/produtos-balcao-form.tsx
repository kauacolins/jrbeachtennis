"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { atualizarProduto } from "@/features/produtos/actions/salvar-produto";
import type { ProdutoBalcao } from "@/features/produtos/actions/listar-produtos";

function reaisParaCentavos(valor: string) {
  const centavos = Math.round(Number(valor.replace(",", ".")) * 100);
  return Number.isFinite(centavos) && centavos >= 0 ? centavos : null;
}

// RF17/RF18: um cartão por produto (day use e mensal). Preço novo vale só
// pro que for vendido daqui pra frente (preço congelado).
function ProdutoBalcaoCard({ produto }: { produto: ProdutoBalcao }) {
  const router = useRouter();
  const [preco, setPreco] = useState((produto.precoCentavos / 100).toFixed(2));
  const [limite, setLimite] = useState(produto.limiteDiario?.toString() ?? "");
  const [salvando, startTransition] = useTransition();
  const ehDayUse = produto.tipo === "DAY_USE";

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const precoCentavos = reaisParaCentavos(preco);
    if (precoCentavos === null) {
      toast.error("Preço inválido.");
      return;
    }
    const limiteDiario = limite.trim() === "" ? null : Number(limite);

    startTransition(async () => {
      const resultado = await atualizarProduto({
        produtoId: produto.id,
        precoCentavos,
        limiteDiario,
        ativo: produto.ativo,
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(`${produto.nome} atualizado.`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div>
        <h3 className="font-medium">{produto.nome}</h3>
        <p className="text-xs text-muted-foreground">
          {ehDayUse
            ? "Por pessoa, entrada livre o dia todo."
            : `Por pessoa, ${produto.duracaoDias ?? 30} dias de day use livre.`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`preco-${produto.id}`}>Preço (R$)</Label>
          <Input
            id={`preco-${produto.id}`}
            type="number"
            min="0"
            step="0.01"
            required
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />
        </div>
        {ehDayUse && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`limite-${produto.id}`}>Limite por dia</Label>
            <Input
              id={`limite-${produto.id}`}
              type="number"
              min="1"
              step="1"
              placeholder="Sem limite"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
            />
          </div>
        )}
      </div>
      <Button type="submit" size="sm" variant="outline" className="self-end" disabled={salvando}>
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}

export function ProdutosBalcaoForm({ produtos }: { produtos: ProdutoBalcao[] }) {
  return (
    <section aria-labelledby="balcao-titulo" className="flex flex-col gap-3">
      <h1 id="balcao-titulo" className="font-heading text-xl font-bold">
        Day use e mensal
      </h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {produtos.map((produto) => (
          <ProdutoBalcaoCard key={produto.id} produto={produto} />
        ))}
      </div>
    </section>
  );
}
