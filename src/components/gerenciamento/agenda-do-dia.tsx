"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendaGrid } from "@/components/gerenciamento/agenda-grid";
import { ReservasDoDiaLista } from "@/components/gerenciamento/reservas-dia-lista";
import {
  ReservaDetalhePainel,
  type PixArena,
  type SelecaoAgenda,
} from "@/components/gerenciamento/reserva-detalhe-painel";
import { NovaReservaDialog } from "@/components/gerenciamento/nova-reserva-dialog";
import type { AgendaBloco, AgendaDia } from "@/features/gerenciamento/actions/obter-agenda-dia";
import type { QuadraAdmin } from "@/features/quadras/actions/listar-quadras-admin";

// Dono do estado local da agenda do dia: guarda os blocos pra poder
// atualizar pago/status/cancelamento otimisticamente (ver
// ReservaDetalhePainel) e repassa a mesma cópia pra grade e pra listagem,
// assim as duas ficam sincronizadas quando uma reserva é alterada pelo
// painel.
export function AgendaDoDia({
  agenda,
  hojeISO,
  quadrasAdmin,
  navegacao,
  pix,
}: {
  agenda: AgendaDia;
  hojeISO: string;
  quadrasAdmin: QuadraAdmin[];
  /** Controle de dia (vem do servidor) — entra no cabeçalho junto do título. */
  navegacao: ReactNode;
  pix?: PixArena | null;
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
    <div className="flex gap-4">
      <div className="min-w-0 flex-1">
        {/* Celular: título + "Nova reserva" na mesma linha (ação ao alcance do
            polegar, sem empurrar a lista pra baixo) e a navegação de dia
            ocupando a linha de baixo inteira. Desktop: tudo numa linha,
            título | dia | ação. A ordem é feita com `order` pra não duplicar
            o botão. */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="order-1 mr-auto font-heading text-xl font-bold">Agenda do dia</h1>
          {navegacao}
          <Button
            className="order-2 h-10 md:order-3 md:h-9"
            onClick={() => setNovaReservaAberta(true)}
          >
            <Plus aria-hidden />
            Nova reserva
          </Button>
        </div>

        {/* No celular a grade visual (uma coluna por quadra) fica larga e alta
            demais pra tela — vira só a lista abaixo, que já é compacta e tem
            os mesmos dados e ações. */}
        <div className="hidden md:block">
          <AgendaGrid
            agenda={agendaAtual}
            hojeISO={hojeISO}
            onSelecionarReserva={selecionarReserva}
          />
        </div>

        <h2 className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">
          Reservas do dia
        </h2>
        <ReservasDoDiaLista
          agenda={agendaAtual}
          onSelecionarReserva={selecionarReserva}
          onAtualizado={atualizarBloco}
        />
      </div>

      <ReservaDetalhePainel
        selecao={selecao}
        dataISO={agenda.dataISO}
        pix={pix}
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
    </div>
  );
}
