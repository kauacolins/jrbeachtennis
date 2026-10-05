"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatarDataLonga, formatarHora, formatarPreco } from "@/lib/format";
import { cancelarReserva } from "@/features/reservas/actions/cancelar-reserva";
import type { ReservaUsuario } from "@/features/reservas/actions/listar-reservas-usuario";

const STATUS_INFO: Record<
  ReservaUsuario["status"],
  { label: string; className: string }
> = {
  PENDENTE_PAGAMENTO: {
    label: "Aguardando pagamento",
    className: "bg-warning text-warning-foreground",
  },
  CONFIRMADA: {
    label: "Confirmada",
    className: "bg-accent text-accent-foreground",
  },
  CANCELADA: {
    label: "Cancelada",
    className: "bg-muted text-muted-foreground",
  },
  CONCLUIDA: {
    label: "Concluída",
    className: "bg-secondary text-secondary-foreground",
  },
  NAO_COMPARECEU: {
    label: "Não compareceu",
    className: "bg-destructive/10 text-destructive",
  },
};

const PRAZO_CANCELAMENTO_MS = 24 * 60 * 60_000;

export function ReservaCard({ reserva }: { reserva: ReservaUsuario }) {
  const [cancelando, startTransition] = useTransition();
  const [cancelada, setCancelada] = useState(reserva.status === "CANCELADA");
  const [dialogoAberto, setDialogoAberto] = useState(false);

  const status = cancelada ? "CANCELADA" : reserva.status;
  const info = STATUS_INFO[status];
  const dentroDoPrazo =
    reserva.inicio.getTime() - Date.now() > PRAZO_CANCELAMENTO_MS;

  function confirmarCancelamento() {
    startTransition(async () => {
      const resultado = await cancelarReserva(reserva.id);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      setCancelada(true);
      setDialogoAberto(false);
      toast.success("Reserva cancelada.");
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{reserva.modalidade.nome}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {formatarDataLonga(reserva.inicio)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatarHora(reserva.inicio)} às {formatarHora(reserva.fim)} ·{" "}
            {formatarPreco(reserva.valorCentavos)}
          </p>
        </div>
        <Badge className={info.className}>{info.label}</Badge>
      </div>

      {status === "CONFIRMADA" &&
        (dentroDoPrazo ? (
          <AlertDialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
            <AlertDialogTrigger
              render={
                <Button variant="outline" size="sm" className="self-start" />
              }
            >
              Cancelar reserva
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar essa reserva?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cancelamento gratuito até 24h antes do horário. Essa ação
                  não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={cancelando}
                  onClick={confirmarCancelamento}
                >
                  {cancelando ? "Cancelando…" : "Cancelar reserva"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <p className="text-xs text-muted-foreground">
            Prazo de cancelamento online encerrado. Fale com a Arena JR pra
            ajustar.
          </p>
        ))}
    </div>
  );
}
