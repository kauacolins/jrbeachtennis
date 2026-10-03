"use client";

import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export interface DiaDisponivel {
  dataISO: string;
  diaSemana: number;
  fechada: boolean;
}

export function SeletorDia({
  dias,
  hojeISO,
  selecionado,
  onSelecionar,
}: {
  dias: DiaDisponivel[];
  hojeISO: string;
  selecionado: string;
  onSelecionar: (dataISO: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Escolher o dia"
      className="flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {dias.map((dia) => {
        const numero = Number(dia.dataISO.slice(-2));
        const ativo = dia.dataISO === selecionado;
        const hoje = dia.dataISO === hojeISO;

        return (
          <button
            key={dia.dataISO}
            type="button"
            disabled={dia.fechada}
            aria-pressed={ativo}
            aria-label={`${hoje ? "Hoje, " : ""}${DIAS_SEMANA[dia.diaSemana]} ${numero}${dia.fechada ? ", fechado" : ""}`}
            onClick={() => onSelecionar(dia.dataISO)}
            className={cn(
              "flex h-14 w-14 shrink-0 snap-start flex-col items-center justify-center rounded-lg border text-xs font-medium transition-colors",
              dia.fechada &&
                "cursor-not-allowed border-transparent bg-muted text-muted-foreground opacity-50",
              !dia.fechada &&
                !ativo &&
                "border-border bg-background hover:bg-muted",
              ativo && "border-primary bg-primary text-primary-foreground"
            )}
          >
            <span>{hoje ? "Hoje" : DIAS_SEMANA[dia.diaSemana]}</span>
            <span className="text-base font-semibold">{numero}</span>
          </button>
        );
      })}
    </div>
  );
}
