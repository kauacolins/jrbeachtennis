"use client";

import { formatInTimeZone } from "date-fns-tz";
import { cn } from "@/lib/utils";
import { minutosParaHora } from "@/lib/format";
import { TIME_ZONE } from "@/lib/constants";
import type { AgendaBloco, AgendaDia } from "@/features/gerenciamento/actions/obter-agenda-dia";

const ALTURA_LINHA = 64; // px por hora
const ALTURA_CABECALHO = 40;
const LARGURA_COLUNA_HORA = 56;
const LARGURA_MIN_QUADRA = 180;

function minutosAgora() {
  const label = formatInTimeZone(new Date(), TIME_ZONE, "HH:mm");
  const [h, m] = label.split(":").map(Number);
  return h * 60 + m;
}

// RF13: visão do dia com todas as quadras lado a lado — colunas = quadras,
// linhas = horas. Reaproveita o mesmo conceito de slot de 60 min usado em
// listarHorariosDisponiveis (RF06). O bloco mostra só nome + horário pra
// caber na grade; o detalhe completo (telefone, valor, status) e as ações
// (RF15) ficam no diálogo aberto ao clicar (ver ReservaDetalheDialog).
export function AgendaGrid({
  agenda,
  hojeISO,
  onSelecionarReserva,
}: {
  agenda: AgendaDia;
  hojeISO: string;
  onSelecionarReserva: (bloco: AgendaBloco, quadraNome: string) => void;
}) {
  if (!agenda.grade || agenda.quadras.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma quadra abre nesse dia.
      </p>
    );
  }

  const { inicioMin, fimMin } = agenda.grade;
  const horas: number[] = [];
  for (let min = inicioMin; min < fimMin; min += 60) horas.push(min);

  const colunas = agenda.quadras.length;
  const gridTemplateColumns = `${LARGURA_COLUNA_HORA}px repeat(${colunas}, minmax(${LARGURA_MIN_QUADRA}px, 1fr))`;
  const gridTemplateRows = `${ALTURA_CABECALHO}px repeat(${horas.length}, ${ALTURA_LINHA}px)`;

  const ehHoje = agenda.dataISO === hojeISO;
  const agoraMin = ehHoje ? minutosAgora() : null;
  const mostrarAgora =
    agoraMin !== null && agoraMin >= inicioMin && agoraMin < fimMin;

  return (
    <div className="overflow-x-auto rounded-xl border">
      <div className="relative grid min-w-full" style={{ gridTemplateColumns, gridTemplateRows }}>
        <div
          className="sticky top-0 left-0 z-20 border-b bg-background"
          style={{ gridColumn: 1, gridRow: 1 }}
        />
        {agenda.quadras.map((quadra, i) => (
          <div
            key={quadra.quadraId}
            className="sticky top-0 z-10 flex items-center truncate border-b border-l bg-background px-3 text-sm font-semibold"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {quadra.nome}
          </div>
        ))}

        {horas.map((min, r) => (
          <div
            key={min}
            className="sticky left-0 z-10 border-b border-r bg-background px-2 py-1 text-right text-xs text-muted-foreground"
            style={{ gridColumn: 1, gridRow: r + 2 }}
          >
            {minutosParaHora(min)}
          </div>
        ))}

        {agenda.quadras.map((quadra, i) =>
          horas.map((min) => {
            const fechada =
              quadra.abreMin === null ||
              quadra.fechaMin === null ||
              min < quadra.abreMin ||
              min >= quadra.fechaMin;
            const rowIndex = 2 + (min - inicioMin) / 60;
            return (
              <div
                key={`${quadra.quadraId}-${min}`}
                className={cn(
                  "border-b border-l",
                  fechada ? "bg-muted/60" : "bg-background"
                )}
                style={{ gridColumn: i + 2, gridRow: rowIndex }}
              />
            );
          })
        )}

        {agenda.quadras.map((quadra, i) =>
          quadra.blocos.map((bloco) => {
            const rowStart = 2 + Math.max(0, (bloco.inicioMin - inicioMin) / 60);
            const rowSpan = Math.max(1, (bloco.fimMin - bloco.inicioMin) / 60);
            const naoCompareceu = bloco.status === "NAO_COMPARECEU";
            const cancelada = bloco.status === "CANCELADA";
            const aPagar =
              bloco.tipo === "reserva" && !bloco.pago && !naoCompareceu && !cancelada;
            const ehReserva = bloco.tipo === "reserva";

            return (
              <button
                key={bloco.id}
                type="button"
                disabled={!ehReserva}
                onClick={() => ehReserva && onSelecionarReserva(bloco, quadra.nome)}
                className={cn(
                  "m-0.5 flex flex-col overflow-hidden rounded-md border px-1.5 py-1 text-left text-xs leading-tight outline-none",
                  ehReserva && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring",
                  !ehReserva && "cursor-default",
                  bloco.tipo === "bloqueio" &&
                    "border-dashed border-muted-foreground/40 bg-[repeating-linear-gradient(45deg,var(--color-muted)_0px,var(--color-muted)_6px,transparent_6px,transparent_12px)] text-muted-foreground",
                  ehReserva &&
                    cancelada &&
                    "border-muted-foreground/30 bg-muted text-muted-foreground line-through",
                  ehReserva &&
                    !cancelada &&
                    naoCompareceu &&
                    "border-destructive/30 bg-destructive/10 text-destructive",
                  aPagar && "border-warning bg-warning/15 text-foreground",
                  ehReserva &&
                    !cancelada &&
                    !naoCompareceu &&
                    !aPagar &&
                    "border-accent bg-accent text-accent-foreground"
                )}
                style={{
                  gridColumn: i + 2,
                  gridRow: `${rowStart} / span ${rowSpan}`,
                }}
                title={`${bloco.titulo}${bloco.subtitulo ? ` · ${bloco.subtitulo}` : ""} · ${minutosParaHora(bloco.inicioMin)}–${minutosParaHora(bloco.fimMin)}`}
              >
                <span className="truncate font-medium">{bloco.titulo}</span>
                <span className="truncate opacity-80">
                  {minutosParaHora(bloco.inicioMin)}–{minutosParaHora(bloco.fimMin)}
                </span>
              </button>
            );
          })
        )}

        {mostrarAgora && (
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 left-0 z-20 border-t-2 border-destructive"
            style={{
              top: `${ALTURA_CABECALHO + ((agoraMin! - inicioMin) / 60) * ALTURA_LINHA}px`,
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-4 border-t p-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-accent bg-accent" />
          Confirmada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-warning bg-warning/15" />
          A pagar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-destructive/30 bg-destructive/10" />
          Não compareceu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-muted-foreground/40 bg-[repeating-linear-gradient(45deg,var(--color-muted)_0px,var(--color-muted)_4px,transparent_4px,transparent_8px)]" />
          Bloqueado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-muted/60" />
          Fechada
        </span>
      </div>
    </div>
  );
}
