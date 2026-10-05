"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaGrid } from "@/components/gerenciamento/agenda-grid";
import { ReservasDoDiaLista } from "@/components/gerenciamento/reservas-dia-lista";
import {
  ReservaDetalheDialog,
  type SelecaoAgenda,
} from "@/components/gerenciamento/reserva-detalhe-dialog";
import { NovaReservaDialog } from "@/components/gerenciamento/nova-reserva-dialog";
import type { AgendaBloco, AgendaDia } from "@/features/gerenciamento/actions/obter-agenda-dia";
import type { QuadraAdmin } from "@/features/quadras/actions/listar-quadras-admin";

// Dono do estado local da agenda do dia: guarda os blocos pra poder
// atualizar pago/status/cancelamento otimisticamente (ver ReservaDetalheDialog)
// e repassa a mesma cópia pra grade e pra listagem, assim as duas ficam
// sincronizadas quando uma reserva é alterada pelo diálogo.
export function AgendaDoDia({
  agenda,
  hojeISO,
  quadrasAdmin,
}: {
  agenda: AgendaDia;
  hojeISO: string;
  quadrasAdmin: QuadraAdmin[];
}) {
  const [quadras, setQuadras] = useState(agenda.quadras);
  const [selecao, setSelecao] = useState<SelecaoAgenda | null>(null);
  const [novaReservaAberta, setNovaReservaAberta] = useState(false);

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

  function adicionarBloco(quadraId: string, bloco: AgendaBloco) {
    setQuadras((atual) =>
      atual.map((quadra) =>
        quadra.quadraId === quadraId
          ? {
              ...quadra,
              blocos: [...quadra.blocos, bloco].sort(
                (a, b) => a.inicioMin - b.inicioMin
              ),
            }
          : quadra
      )
    );
  }

  const agendaAtual: AgendaDia = { ...agenda, quadras };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button className="h-11" onClick={() => setNovaReservaAberta(true)}>
          <Plus aria-hidden />
          Nova reserva
        </Button>
      </div>

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

      <NovaReservaDialog
        aberto={novaReservaAberta}
        onOpenChange={setNovaReservaAberta}
        quadras={quadrasAdmin}
        dataISO={agenda.dataISO}
        onCriada={adicionarBloco}
      />
    </>
  );
}
