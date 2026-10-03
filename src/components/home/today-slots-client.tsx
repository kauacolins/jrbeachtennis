"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarX2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listarHorariosDisponiveisPorModalidade,
} from "@/features/reservas/actions/listar-horarios-disponiveis-modalidade";
import type { Slot } from "@/features/reservas/actions/listar-horarios-disponiveis";
import { adicionarDias } from "@/lib/datas";

const MAXIMO_SLOTS = 8;

export function TodaySlotsClient({
  modalidades,
  modalidadeInicialId,
  slotsIniciais,
  hojeISO,
}: {
  modalidades: { id: string; nome: string }[];
  modalidadeInicialId: string;
  slotsIniciais: Slot[];
  hojeISO: string;
}) {
  const [modalidadeId, setModalidadeId] = useState(modalidadeInicialId);
  const [slots, setSlots] = useState(slotsIniciais);
  const [carregando, startTransition] = useTransition();

  function selecionarModalidade(id: string) {
    setModalidadeId(id);
    startTransition(async () => {
      const novosSlots = await listarHorariosDisponiveisPorModalidade(
        id,
        hojeISO
      );
      setSlots(novosSlots);
    });
  }

  const proximos = slots
    .filter((s) => s.status !== "passado")
    .slice(0, MAXIMO_SLOTS);
  const amanhaISO = adicionarDias(hojeISO, 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Livres hoje
        </h2>
        <Link
          href={`/reservar/${modalidadeId}`}
          className="text-sm font-medium text-brand-text hover:underline"
        >
          Ver agenda completa
        </Link>
      </div>

      {modalidades.length > 1 && (
        <div
          role="group"
          aria-label="Escolher modalidade"
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {modalidades.map((modalidade) => {
            const ativa = modalidade.id === modalidadeId;
            return (
              <button
                key={modalidade.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => selecionarModalidade(modalidade.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  ativa
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {modalidade.nome}
              </button>
            );
          })}
        </div>
      )}

      {carregando ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: MAXIMO_SLOTS }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : proximos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
          <CalendarX2 className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Hoje já lotou.</p>
          <Button
            variant="outline"
            className="h-11"
            render={
              <Link href={`/reservar/${modalidadeId}?data=${amanhaISO}`} />
            }
            nativeButton={false}
          >
            Ver amanhã
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {proximos.map((slot) => {
            const livre = slot.status === "livre";
            return livre ? (
              <Link
                key={slot.inicio}
                href={`/reservar/${modalidadeId}?data=${hojeISO}&hora=${slot.horaLabel}`}
                aria-label={`${slot.horaLabel}, livre`}
                className="flex h-11 items-center justify-center rounded-lg bg-accent text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
              >
                {slot.horaLabel}
              </Link>
            ) : (
              <div
                key={slot.inicio}
                aria-label={`${slot.horaLabel}, ocupado`}
                className="flex h-11 flex-col items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground line-through"
              >
                {slot.horaLabel}
                <span className="text-[0.65rem] no-underline">Ocupado</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
