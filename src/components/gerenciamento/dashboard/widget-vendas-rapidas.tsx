"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WidgetCard, WidgetVazio } from "@/components/gerenciamento/dashboard/widget-card";
import { ComandaDayUseBotao } from "@/components/gerenciamento/balcao/comanda-day-use-botao";
import { formatarPreco } from "@/lib/format";
import { filtrarPorBusca } from "@/lib/busca";
import type { ComandaResumo } from "@/features/comandas/actions/listar-comandas";

// Dashboard, widget "Vendas rápidas" (admin-panel-ui, Quick Sales):
// comandas abertas agora + o total faturado hoje (comandas já fechadas),
// pra ter o pulso do balcão sem abrir a tela de Comandas.
export function WidgetVendasRapidas({
  comandasAbertas,
  faturadoHojeCentavos,
  vendasHoje,
  className,
}: {
  comandasAbertas: ComandaResumo[];
  faturadoHojeCentavos: number;
  vendasHoje: number;
  className?: string;
}) {
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(
    () => filtrarPorBusca(comandasAbertas, busca, (c) => [c.nome]),
    [comandasAbertas, busca]
  );

  return (
    <WidgetCard
      titulo="Vendas rápidas"
      href="/gerenciamento/comandas"
      className={className}
      acoes={
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Buscar comanda…"
            className="h-11 text-base md:h-8 md:text-xs"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            Faturado hoje: <span className="font-medium text-foreground">{formatarPreco(faturadoHojeCentavos)}</span>
            {" · "}Vendas: {vendasHoje}
          </p>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="h-12 w-full text-base font-semibold md:h-11"
            nativeButton={false}
            render={<Link href="/gerenciamento/comandas/pedido" />}
          >
            Nova venda rápida
          </Button>
          <ComandaDayUseBotao className="h-12 w-full md:h-10" />
        </div>
      }
    >
      {visiveis.length === 0 ? (
        <WidgetVazio texto={busca ? "Nenhuma comanda encontrada." : "Nenhuma comanda aberta."} />
      ) : (
        <ul className="flex flex-col gap-1">
          {visiveis.map((c) => (
            <li key={c.id}>
              <Link
                href={`/gerenciamento/comandas/${c.id}`}
                className="flex min-h-12 items-center gap-2 rounded-lg py-2 text-sm hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.qtdItens} {c.qtdItens === 1 ? "item" : "itens"} ·{" "}
                    {formatDistanceToNow(new Date(c.abertaEm), { locale: ptBR, addSuffix: true })}
                  </p>
                </div>
                <Badge variant="outline">Aberta</Badge>
                <span className="font-medium tabular-nums">{formatarPreco(c.totalCentavos)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
