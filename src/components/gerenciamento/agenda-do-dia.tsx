"use client";

import { useState } from "react";
import { AgendaGrid } from "@/components/gerenciamento/agenda-grid";
import { ReservasDoDiaLista } from "@/components/gerenciamento/reservas-dia-lista";
import {
  ReservaDetalheDialog,
  type SelecaoAgenda,
} from "@/components/gerenciamento/reserva-detalhe-dialog";
import type { AgendaBloco, AgendaDia } from "@/features/gerenciamento/actions/obter-agenda-dia";

// Dono do estado local da agenda do dia: guarda os blocos pra poder
// atualizar pago/status/cancelamento otimisticamente (ver ReservaDetalheDialog)
// e repassa a mesma cópia pra grade e pra listagem, assim as duas ficam
// sincronizadas quando uma reserva é alterada pelo diálogo.
export function AgendaDoDia({
  agenda,
  hojeISO,
}: {
  agenda: AgendaDia;
  hojeISO: string;
}) {
  const [quadras, setQuadras] = useState(agenda.quadras);
  const [selecao, setSelecao] = useState<SelecaoAgenda | null>(null);

  function selecionarReserva(bloco: AgendaBloco, quadraNome: string) {
    if (bloco.tipo !== "reserva") return;
    setSelecao({ bloco, quadraNome });
  }

  function atualizarBloco(id: string, patch: Partial<AgendaBloco>) {
    setQuadras((atual) =>
      atual.map((quadra) => ({
        ...quadra,
        blocos: quadra.blocos.map((bloco) =>
          bloco.id === id ? { ...bloco, ...patch } : bloco
        ),
      }))
    );
    setSelecao((atual) =>
      atual && atual.bloco.id === id
        ? { ...atual, bloco: { ...atual.bloco, ...patch } }
        : atual
    );
  }

  const agendaAtual: AgendaDia = { ...agenda, quadras };

  return (
    <>
      <AgendaGrid
        agenda={agendaAtual}
        hojeISO={hojeISO}
        onSelecionarReserva={selecionarReserva}
      />

      <h2 className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">
        Reservas do dia
      </h2>
      <ReservasDoDiaLista
        agenda={agendaAtual}
        onSelecionarReserva={selecionarReserva}
        onAtualizado={atualizarBloco}
      />

      <ReservaDetalheDialog
        selecao={selecao}
        dataISO={agenda.dataISO}
        onOpenChange={(aberto) => !aberto && setSelecao(null)}
        onAtualizado={atualizarBloco}
      />
    </>
  );
}
