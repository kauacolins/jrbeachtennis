"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatarHora, formatarPreco } from "@/lib/format";
import {
  adicionarReservaComanda,
  listarReservasParaComanda,
  type ReservaParaComanda,
} from "@/features/comandas/actions/adicionar-reserva";

// RF37: escolhe uma reserva de hoje ainda não paga e fora de outra comanda.
// Reserva nova se cria na Agenda (RF14) e depois entra aqui.
export function ReservaComandaDialog({
  aberto,
  onOpenChange,
  comandaId,
  onAdicionado,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  comandaId: string;
  onAdicionado: () => void;
}) {
  const [reservas, setReservas] = useState<ReservaParaComanda[] | null>(null);
  const [pendente, startTransition] = useTransition();

  useEffect(() => {
    if (!aberto) return;
    setReservas(null);
    listarReservasParaComanda().then(setReservas);
  }, [aberto]);

  function adicionar(reservaId: string) {
    startTransition(async () => {
      const resultado = await adicionarReservaComanda({ comandaId, reservaId });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Reserva adicionada à comanda.");
      onOpenChange(false);
      onAdicionado();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserva de hoje</DialogTitle>
          <DialogDescription>Só aparecem reservas de hoje que ainda não foram pagas.</DialogDescription>
        </DialogHeader>

        {reservas === null ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : reservas.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma reserva de hoje a pagar. Para criar uma, use a{" "}
            <Link href="/gerenciamento/agenda" className="font-medium text-primary underline-offset-4 hover:underline">
              Agenda
            </Link>
            .
          </p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
            {reservas.map((reserva) => (
              <li key={reserva.id}>
                <button
                  type="button"
                  disabled={pendente}
                  onClick={() => adicionar(reserva.id)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{reserva.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {reserva.quadra} · {formatarHora(reserva.inicio)}–{formatarHora(reserva.fim)}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatarPreco(reserva.valorCentavos)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
