"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WidgetCard, WidgetVazio } from "@/components/gerenciamento/dashboard/widget-card";
import { marcarReservaPago } from "@/features/reservas/actions/marcar-reserva-pago";
import { minutosParaHora } from "@/lib/format";
import { STATUS_RESERVA_INFO } from "@/lib/status-reserva";
import type { AgendaDia } from "@/features/gerenciamento/actions/obter-agenda-dia";

interface ReservaFeed {
  id: string;
  titulo: string;
  quadraNome: string;
  inicioMin: number;
  fimMin: number;
  status: string;
  pago: boolean;
}

function achatarReservas(agenda: AgendaDia): ReservaFeed[] {
  return agenda.quadras
    .flatMap((quadra) =>
      quadra.blocos
        .filter((b) => b.tipo === "reserva" && b.status !== "CANCELADA")
        .map((b) => ({
          id: b.id,
          titulo: b.titulo,
          quadraNome: quadra.nome,
          inicioMin: b.inicioMin,
          fimMin: b.fimMin,
          status: b.status ?? "CONFIRMADA",
          pago: Boolean(b.pago),
        }))
    )
    .sort((a, b) => a.inicioMin - b.inicioMin);
}

// Dashboard, widget "Reservas" (admin-panel-ui, Booking Log): feed das
// reservas de hoje com ação direta de marcar pago. Reaproveita a mesma
// AgendaDia da agenda do dia, só que achatada numa lista só.
export function WidgetReservas({ agendaInicial }: { agendaInicial: AgendaDia }) {
  const [reservas, setReservas] = useState(() => achatarReservas(agendaInicial));
  const [aba, setAba] = useState<"hoje" | "a_pagar">("hoje");
  const [emAndamento, startTransition] = useTransition();

  const visiveis = useMemo(
    () => (aba === "a_pagar" ? reservas.filter((r) => !r.pago) : reservas),
    [reservas, aba]
  );

  function marcarPago(id: string) {
    startTransition(async () => {
      const resultado = await marcarReservaPago(id, true);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      setReservas((atual) => atual.map((r) => (r.id === id ? { ...r, pago: true } : r)));
      toast.success("Marcado como pago.");
    });
  }

  return (
    <WidgetCard
      titulo="Reservas"
      href="/gerenciamento/agenda"
      acoes={
        <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
          <TabsList variant="line">
            <TabsTrigger value="hoje" className="data-active:after:bg-primary">
              Hoje ({reservas.length})
            </TabsTrigger>
            <TabsTrigger value="a_pagar" className="data-active:after:bg-primary">
              Aguardando pagamento ({reservas.filter((r) => !r.pago).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
      footer={
        <Button variant="secondary" className="w-full" nativeButton={false} render={<a href="/gerenciamento/agenda" />}>
          Ver todas as reservas
        </Button>
      }
    >
      {visiveis.length === 0 ? (
        <WidgetVazio
          texto={aba === "a_pagar" ? "Nenhuma reserva aguardando pagamento." : "Nenhuma reserva hoje."}
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {visiveis.map((r) => {
            const info = STATUS_RESERVA_INFO[r.status] ?? STATUS_RESERVA_INFO.CONFIRMADA;
            return (
              <li key={r.id} className="flex items-center gap-2 rounded-lg py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.titulo}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <CalendarDays className="size-3" aria-hidden />
                    {r.quadraNome} · {minutosParaHora(r.inicioMin)}–{minutosParaHora(r.fimMin)}
                  </p>
                </div>
                {r.pago ? (
                  <Badge className={info.className}>{info.label}</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={emAndamento}
                    onClick={() => marcarPago(r.id)}
                  >
                    Marcar pago
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
