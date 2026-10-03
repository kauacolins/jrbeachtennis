"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarPreco } from "@/lib/format";
import type { Slot } from "@/features/reservas/actions/listar-horarios-disponiveis";

export function GradeHorarios({
  slots,
  precoHoraCentavos,
  inicioSelecionado,
  onSelecionar,
}: {
  slots: Slot[];
  precoHoraCentavos: number;
  inicioSelecionado: string | null;
  onSelecionar: (slot: Slot) => void;
}) {
  if (slots.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        A quadra não abre nesse dia.
      </p>
    );
  }

  return (
    <div
      role="group"
      aria-label="Horários"
      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
    >
      {slots.map((slot) => {
        const selecionado = inicioSelecionado === slot.inicio;
        const livre = slot.status === "livre";
        const label =
          slot.status === "ocupado"
            ? `${slot.horaLabel}, ocupado`
            : slot.status === "passado"
              ? `${slot.horaLabel}, horário passado`
              : `${slot.horaLabel}, livre, ${formatarPreco(precoHoraCentavos)} a hora`;

        return (
          <button
            key={slot.inicio}
            type="button"
            disabled={!livre}
            aria-pressed={selecionado}
            aria-label={label}
            onClick={() => livre && onSelecionar(slot)}
            className={cn(
              "flex h-11 flex-col items-center justify-center rounded-lg border text-sm font-medium transition-colors",
              !livre &&
                "cursor-not-allowed border-transparent bg-muted text-muted-foreground line-through opacity-60",
              livre &&
                !selecionado &&
                "border-border bg-background hover:bg-muted",
              selecionado &&
                "border-primary bg-primary text-primary-foreground"
            )}
          >
            <span className="flex items-center gap-1">
              {selecionado && <Check className="size-3.5" aria-hidden />}
              {slot.horaLabel}
            </span>
            {slot.status === "ocupado" && (
              <span className="text-[0.65rem]">Ocupado</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
