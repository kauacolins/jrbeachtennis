"use client";

import { useState, useTransition } from "react";
import { formatarHora, formatarPreco } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SeletorDia, type DiaDisponivel } from "@/components/reservas/seletor-dia";
import { GradeHorarios } from "@/components/reservas/grade-horarios";
import { SeletorDuracao } from "@/components/reservas/seletor-duracao";
import {
  ResumoReserva,
  type ReservaConfirmada,
} from "@/components/reservas/resumo-reserva";
import { ReservaSucesso } from "@/components/reservas/reserva-sucesso";
import { listarHorariosDisponiveisPorModalidade } from "@/features/reservas/actions/listar-horarios-disponiveis-modalidade";
import type { Slot } from "@/features/reservas/actions/listar-horarios-disponiveis";

interface ModalidadeParaReserva {
  id: string;
  nome: string;
  precoHoraCentavos: number;
}

export function BookingWidget({
  modalidade,
  dias,
  slotsIniciais,
  hojeISO,
  dataInicial = hojeISO,
  horaInicial,
}: {
  modalidade: ModalidadeParaReserva;
  dias: DiaDisponivel[];
  slotsIniciais: Slot[];
  hojeISO: string;
  /** Dia pré-selecionado (ex.: vindo de "Livres hoje" na home). Padrão: hoje. */
  dataInicial?: string;
  /** Horário pré-selecionado no formato "HH:mm", se já estava livre. */
  horaInicial?: string;
}) {
  const [dataSelecionada, setDataSelecionada] = useState(dataInicial);
  const [slots, setSlots] = useState(slotsIniciais);
  const [carregando, startTransition] = useTransition();
  const [slotSelecionado, setSlotSelecionado] = useState<Slot | null>(() =>
    horaInicial
      ? slotsIniciais.find(
          (s) => s.horaLabel === horaInicial && s.status === "livre"
        ) ?? null
      : null
  );
  const [duracao, setDuracao] = useState(1);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [reserva, setReserva] = useState<ReservaConfirmada | null>(null);

  function buscarSlots(dataISO: string) {
    startTransition(async () => {
      const novosSlots = await listarHorariosDisponiveisPorModalidade(
        modalidade.id,
        dataISO
      );
      setSlots(novosSlots);
      setSlotSelecionado(null);
    });
  }

  function selecionarDia(dataISO: string) {
    setDataSelecionada(dataISO);
    setSlotSelecionado(null);
    if (dataISO === dataInicial) {
      setSlots(slotsIniciais);
      return;
    }
    buscarSlots(dataISO);
  }

  function selecionarSlot(slot: Slot) {
    setSlotSelecionado(slot);
    setDuracao(1);
  }

  if (reserva) {
    return (
      <ReservaSucesso
        modalidadeNome={modalidade.nome}
        inicioISO={reserva.inicio}
        fimISO={reserva.fim}
        valorCentavos={reserva.valorCentavos}
        onReservarOutra={() => {
          setReserva(null);
          buscarSlots(dataSelecionada);
        }}
      />
    );
  }

  const fimPrevistoISO = slotSelecionado
    ? new Date(
        new Date(slotSelecionado.inicio).getTime() + duracao * 60 * 60_000
      ).toISOString()
    : "";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Dia
        </p>
        <SeletorDia
          dias={dias}
          hojeISO={hojeISO}
          selecionado={dataSelecionada}
          onSelecionar={selecionarDia}
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Horário
        </p>
        {carregando ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <GradeHorarios
            slots={slots}
            precoHoraCentavos={modalidade.precoHoraCentavos}
            inicioSelecionado={slotSelecionado?.inicio ?? null}
            onSelecionar={selecionarSlot}
          />
        )}
      </div>

      {slotSelecionado && slotSelecionado.duracaoMaximaHoras > 1 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Duração
          </p>
          <SeletorDuracao
            duracaoMaxima={slotSelecionado.duracaoMaximaHoras}
            valor={duracao}
            onChange={setDuracao}
          />
        </div>
      )}

      {slotSelecionado && (
        <>
          <div className="sticky bottom-0 -mx-4 mt-2 flex items-center justify-between gap-3 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pb-0">
            <div className="text-sm">
              <p className="font-medium">
                {formatarHora(slotSelecionado.inicio)}–
                {formatarHora(fimPrevistoISO)}
              </p>
              <p className="text-muted-foreground">
                {formatarPreco(modalidade.precoHoraCentavos * duracao)}
              </p>
            </div>
            <Button
              className="h-11 px-6"
              onClick={() => setSheetAberto(true)}
            >
              Reservar
            </Button>
          </div>

          <ResumoReserva
            aberto={sheetAberto}
            onAbertoChange={setSheetAberto}
            modalidadeId={modalidade.id}
            modalidadeNome={modalidade.nome}
            inicioISO={slotSelecionado.inicio}
            fimISO={fimPrevistoISO}
            valorCentavos={modalidade.precoHoraCentavos * duracao}
            duracaoHoras={duracao}
            onConfirmado={(resultado) => {
              setReserva(resultado);
              setSheetAberto(false);
            }}
            onConflito={() => buscarSlots(dataSelecionada)}
          />
        </>
      )}
    </div>
  );
}
