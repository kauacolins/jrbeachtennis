"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { atualizarHorarioFuncionamento } from "@/features/quadras/actions/atualizar-horario-funcionamento";
import type { QuadraAdmin } from "@/features/quadras/actions/listar-quadras-admin";

const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

interface DiaForm {
  diaSemana: number;
  fechada: boolean;
  abre: string;
  fecha: string;
}

function paraLabel(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function diasIniciais(quadra: QuadraAdmin): DiaForm[] {
  return Array.from({ length: 7 }, (_, diaSemana) => {
    const horario = quadra.horarios.find((h) => h.diaSemana === diaSemana);
    return horario
      ? {
          diaSemana,
          fechada: false,
          abre: paraLabel(horario.abreMin),
          fecha: paraLabel(horario.fechaMin),
        }
      : { diaSemana, fechada: true, abre: "16:00", fecha: "22:00" };
  });
}

export function HorarioFuncionamentoForm({ quadra }: { quadra: QuadraAdmin }) {
  const [dias, setDias] = useState<DiaForm[]>(() => diasIniciais(quadra));
  const [salvando, startTransition] = useTransition();

  function atualizarDia(diaSemana: number, patch: Partial<DiaForm>) {
    setDias((atual) =>
      atual.map((dia) => (dia.diaSemana === diaSemana ? { ...dia, ...patch } : dia))
    );
  }

  function salvar() {
    startTransition(async () => {
      const resultado = await atualizarHorarioFuncionamento({
        quadraId: quadra.id,
        dias,
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Horário atualizado.");
    });
  }

  return (
    <div className="flex flex-col gap-2 pb-2">
      {dias.map((dia) => (
        <div key={dia.diaSemana} className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex w-28 shrink-0 items-center gap-2">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              checked={!dia.fechada}
              onChange={(e) =>
                atualizarDia(dia.diaSemana, { fechada: !e.target.checked })
              }
            />
            {DIAS_SEMANA[dia.diaSemana]}
          </label>
          <input
            type="time"
            aria-label={`${DIAS_SEMANA[dia.diaSemana]}, abre`}
            value={dia.abre}
            disabled={dia.fechada}
            onChange={(e) => atualizarDia(dia.diaSemana, { abre: e.target.value })}
            className="h-8 rounded-lg border border-border bg-background px-2 disabled:opacity-50"
          />
          <span className="text-muted-foreground">às</span>
          <input
            type="time"
            aria-label={`${DIAS_SEMANA[dia.diaSemana]}, fecha`}
            value={dia.fecha}
            disabled={dia.fechada}
            onChange={(e) => atualizarDia(dia.diaSemana, { fecha: e.target.value })}
            className="h-8 rounded-lg border border-border bg-background px-2 disabled:opacity-50"
          />
        </div>
      ))}
      <Button size="sm" className="mt-2 self-start" disabled={salvando} onClick={salvar}>
        {salvando ? "Salvando…" : "Salvar horário"}
      </Button>
    </div>
  );
}
