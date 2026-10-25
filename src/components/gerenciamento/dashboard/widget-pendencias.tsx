"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Receipt, Ticket, UserRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { WidgetCard, WidgetVazio } from "@/components/gerenciamento/dashboard/widget-card";

interface Pendencia {
  chave: string;
  label: string;
  quantidade: number;
  href: string;
  icone: LucideIcon;
  /** Sai da lista quando o Switch "Só de hoje" está ligado. */
  deOutroDia: boolean;
}

// Dashboard, widget "Pendências" (admin-panel-ui, Tasks): tudo que precisa
// de uma decisão do admin, cada linha com contagem e um atalho direto pra
// resolver. O Switch separa o que é urgente hoje (reserva de hoje sem
// pagamento, comanda que ficou aberta de outro dia) do que é recorrente
// (mensalista vencendo, inscrição de torneio sem pagamento).
export function WidgetPendencias({
  mensaisVencendo,
  reservasNaoPagas,
  comandasAbertasDeOntem,
  inscricoesPendentes,
}: {
  mensaisVencendo: number;
  reservasNaoPagas: number;
  comandasAbertasDeOntem: number;
  inscricoesPendentes: number;
}) {
  const [soDeHoje, setSoDeHoje] = useState(false);

  const itens: Pendencia[] = [
    {
      chave: "reservas",
      label: "Reservas de hoje sem pagamento",
      quantidade: reservasNaoPagas,
      href: "/gerenciamento/agenda",
      icone: CalendarClock,
      deOutroDia: false,
    },
    {
      chave: "comandas",
      label: "Comandas abertas de outro dia",
      quantidade: comandasAbertasDeOntem,
      href: "/gerenciamento/comandas",
      icone: Receipt,
      deOutroDia: false,
    },
    {
      chave: "mensais",
      label: "Mensalistas vencendo",
      quantidade: mensaisVencendo,
      href: "/gerenciamento/planos?filtro=vencendo",
      icone: UserRound,
      deOutroDia: true,
    },
    {
      chave: "inscricoes",
      label: "Inscrições de torneio sem pagamento",
      quantidade: inscricoesPendentes,
      href: "/gerenciamento/torneios",
      icone: Ticket,
      deOutroDia: true,
    },
  ];

  const visiveis = itens.filter((i) => i.quantidade > 0 && (!soDeHoje || !i.deOutroDia));

  return (
    <WidgetCard
      titulo="Pendências"
      acoes={
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <label htmlFor="pendencias-so-hoje">Só de hoje</label>
          <Switch id="pendencias-so-hoje" size="sm" checked={soDeHoje} onCheckedChange={setSoDeHoje} />
        </div>
      }
    >
      {visiveis.length === 0 ? (
        <WidgetVazio texto="Nenhuma pendência — tudo em dia." />
      ) : (
        <ul className="flex flex-col gap-1">
          {visiveis.map((item) => {
            const Icone = item.icone;
            return (
              <li key={item.chave} className="flex items-center gap-3 rounded-lg py-2 text-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
                  <Icone className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <Badge className="bg-warning text-warning-foreground">{item.quantidade}</Badge>
                <Button size="sm" variant="ghost" className="h-9 px-3" nativeButton={false} render={<Link href={item.href} />}>
                  Ver
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
