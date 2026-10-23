"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { cn } from "@/lib/utils";
import { formatarPreco, minutosParaHora } from "@/lib/format";
import { cancelarReservaAdmin } from "@/features/reservas/actions/cancelar-reserva-admin";
import { marcarReservaPago } from "@/features/reservas/actions/marcar-reserva-pago";
import type {
  AgendaBloco,
  AgendaDia,
} from "@/features/gerenciamento/actions/obter-agenda-dia";
import { normalizarBusca } from "@/lib/busca";
import { STATUS_RESERVA_INFO as STATUS_INFO } from "@/lib/status-reserva";

type FiltroPago = "todos" | "pago" | "a_pagar";
type FiltroStatus =
  | "todos"
  | "PENDENTE_PAGAMENTO"
  | "CONFIRMADA"
  | "NAO_COMPARECEU"
  | "CANCELADA";

const FILTROS_PAGO: { valor: FiltroPago; label: string }[] = [
  { valor: "todos", label: "Todos os pagamentos" },
  { valor: "pago", label: "Pago" },
  { valor: "a_pagar", label: "A pagar" },
];

const FILTROS_STATUS: { valor: FiltroStatus; label: string }[] = [
  { valor: "todos", label: "Todos os status" },
  { valor: "PENDENTE_PAGAMENTO", label: "Aguardando Pix" },
  { valor: "CONFIRMADA", label: "Confirmada" },
  { valor: "NAO_COMPARECEU", label: "Não compareceu" },
  { valor: "CANCELADA", label: "Cancelada" },
];

// Select.Value, sem children, mostra o value cru — precisa de uma função
// pra traduzir pro label de exibição.
function labelFiltroPago(valor: FiltroPago) {
  return FILTROS_PAGO.find((filtro) => filtro.valor === valor)?.label ?? valor;
}

function labelFiltroStatus(valor: FiltroStatus) {
  return FILTROS_STATUS.find((filtro) => filtro.valor === valor)?.label ?? valor;
}

interface ReservaComQuadra extends AgendaBloco {
  quadraNome: string;
}

// RF13/RF15: listagem das reservas do dia, com busca e filtros de pagamento
// e status, complementando a agenda visual com o detalhe que não cabe nos
// blocos da grade. Clicar no texto da reserva abre o diálogo completo; os
// botões de "marcar pago" e "cancelar" ficam também aqui pra ação rápida,
// sempre atrás de uma confirmação (ver ConfirmarBotao).
//
// Busca e filtros vivem na URL (?busca=&pago=&status=) pra dar pra
// compartilhar/recarregar a página com o mesmo recorte. A busca usa debounce
// antes de escrever na URL pra não navegar a cada tecla.
export function ReservasDoDiaLista({
  agenda,
  onSelecionarReserva,
  onAtualizado,
}: {
  agenda: AgendaDia;
  onSelecionarReserva: (bloco: AgendaBloco, quadraNome: string) => void;
  onAtualizado: (id: string, patch: Partial<AgendaBloco>) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buscaUrl = searchParams.get("busca") ?? "";
  const filtroPago = (searchParams.get("pago") as FiltroPago | null) ?? "todos";
  const filtroStatus = (searchParams.get("status") as FiltroStatus | null) ?? "todos";

  const [busca, setBusca] = useState(buscaUrl);
  const [pendenteId, setPendenteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Volta/avança no histórico (ou troca de dia) muda a URL por fora — sincroniza o campo.
  useEffect(() => {
    setBusca(buscaUrl);
  }, [buscaUrl]);

  useEffect(() => {
    if (busca === buscaUrl) return;
    const timeout = setTimeout(() => atualizarParam("busca", busca), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  function atualizarParam(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!valor || valor === "todos") {
      params.delete(chave);
    } else {
      params.set(chave, valor);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const reservas: ReservaComQuadra[] = useMemo(
    () =>
      agenda.quadras
        .flatMap((quadra) =>
          quadra.blocos
            .filter((bloco) => bloco.tipo === "reserva")
            .map((bloco) => ({ ...bloco, quadraNome: quadra.nome }))
        )
        .sort((a, b) => a.inicioMin - b.inicioMin),
    [agenda]
  );

  const reservasFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca.trim());
    return reservas.filter((reserva) => {
      if (filtroPago === "pago" && !reserva.pago) return false;
      if (filtroPago === "a_pagar" && reserva.pago) return false;

      const status = reserva.status ?? "CONFIRMADA";
      if (filtroStatus !== "todos" && status !== filtroStatus) return false;

      if (!termo) return true;
      return [reserva.titulo, reserva.subtitulo, reserva.quadraNome]
        .filter(Boolean)
        .some((campo) => normalizarBusca(campo as string).includes(termo));
    });
  }, [reservas, busca, filtroPago, filtroStatus]);

  function marcarPago(id: string, pago: boolean) {
    setPendenteId(id);
    startTransition(async () => {
      const resultado = await marcarReservaPago(id, pago);
      if (!resultado.ok) {
        toast.error(resultado.erro);
      } else {
        onAtualizado(id, { pago });
        toast.success(pago ? "Marcado como pago." : "Marcado como não pago.");
      }
      setPendenteId(null);
    });
  }

  function cancelar(id: string) {
    setPendenteId(id);
    startTransition(async () => {
      const resultado = await cancelarReservaAdmin(id);
      if (!resultado.ok) {
        toast.error(resultado.erro);
      } else {
        onAtualizado(id, { status: "CANCELADA" });
        toast.success("Reserva cancelada.");
      }
      setPendenteId(null);
    });
  }

  // Marcar pago + cancelar, iguais no card (celular) e na linha da tabela.
  function acoes(reserva: ReservaComQuadra, className?: string) {
    const emAndamento = pendenteId === reserva.id && isPending;
    return (
      <>
        <ConfirmarBotao
          size="sm"
          variant="outline"
          className={className}
          label={reserva.pago ? "Marcar não pago" : "Marcar pago"}
          titulo={reserva.pago ? "Marcar como não pago?" : "Marcar como pago?"}
          descricao={
            reserva.pago
              ? "O pagamento volta a aparecer como pendente."
              : "Confirma que o pagamento dessa reserva foi recebido."
          }
          textoConfirmar="Confirmar"
          textoConfirmando="Salvando…"
          disabled={emAndamento}
          onConfirmar={() => marcarPago(reserva.id, !reserva.pago)}
        />
        <ConfirmarBotao
          size="sm"
          variant="destructive"
          actionVariant="destructive"
          className={className}
          label="Cancelar"
          titulo="Cancelar essa reserva?"
          descricao="Libera o horário na agenda. Essa ação não pode ser desfeita."
          textoConfirmar="Cancelar reserva"
          textoConfirmando="Cancelando…"
          disabled={emAndamento}
          onConfirmar={() => cancelar(reserva.id)}
        />
      </>
    );
  }

  if (reservas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhuma reserva nesse dia.
      </p>
    );
  }

  const filtrosAtivos = filtroPago !== "todos" || filtroStatus !== "todos" || busca.trim() !== "";

  return (
    <div className="flex flex-col gap-3">
      {/* Celular: busca na linha inteira e os dois filtros lado a lado embaixo,
          sem rótulo visível (o próprio valor "Todos os status" já diz o que é)
          — empilhar três campos rotulados comia meia tela antes da lista.
          A partir de sm: tudo numa linha, com rótulo. */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end sm:gap-3">
        <div className="col-span-2 flex flex-1 flex-col gap-1.5">
          <Label htmlFor="busca-reservas" className="sr-only sm:not-sr-only">Buscar</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="busca-reservas"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, telefone ou quadra…"
              className="h-10 pl-8 sm:h-9"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="filtro-pago" className="sr-only sm:not-sr-only">Pagamento</Label>
          <Select
            value={filtroPago}
            onValueChange={(valor) => atualizarParam("pago", valor as string)}
          >
            <SelectTrigger id="filtro-pago" className="h-10! w-full sm:h-9! sm:w-40">
              <SelectValue>{(valor: FiltroPago) => labelFiltroPago(valor)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FILTROS_PAGO.map((filtro) => (
                <SelectItem key={filtro.valor} value={filtro.valor}>
                  {filtro.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="filtro-status" className="sr-only sm:not-sr-only">Status</Label>
          <Select
            value={filtroStatus}
            onValueChange={(valor) => atualizarParam("status", valor as string)}
          >
            <SelectTrigger id="filtro-status" className="h-10! w-full sm:h-9! sm:w-44">
              <SelectValue>{(valor: FiltroStatus) => labelFiltroStatus(valor)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FILTROS_STATUS.map((filtro) => (
                <SelectItem key={filtro.valor} value={filtro.valor}>
                  {filtro.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {reservasFiltradas.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {filtrosAtivos
            ? "Nenhuma reserva encontrada com esses filtros."
            : "Nenhuma reserva nesse dia."}
        </p>
      ) : (
        <>
          {/* Celular: um card por reserva — a tabela, com 4+ colunas e dois
              botões por linha, espremia o nome do cliente e cortava as ações. */}
          <ul className="flex flex-col gap-2 md:hidden">
            {reservasFiltradas.map((reserva) => {
              const status = reserva.status ?? "CONFIRMADA";
              const info = STATUS_INFO[status] ?? STATUS_INFO.CONFIRMADA;
              const cancelada = status === "CANCELADA";
              const mostrarStatus = status !== "CONFIRMADA" && !cancelada;
              const temValor = typeof reserva.valorCentavos === "number";

              return (
                <li
                  key={reserva.id}
                  className={cn("rounded-xl border bg-background", cancelada && "opacity-70")}
                >
                  <button
                    type="button"
                    onClick={() => onSelecionarReserva(reserva, reserva.quadraNome)}
                    className="flex w-full flex-col gap-1.5 rounded-xl p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label={`Ver reserva das ${minutosParaHora(reserva.inicioMin)} na ${reserva.quadraNome}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm">
                        <span className="font-semibold tabular-nums">
                          {minutosParaHora(reserva.inicioMin)}–{minutosParaHora(reserva.fimMin)}
                        </span>
                        <span className="text-muted-foreground"> · {reserva.quadraNome}</span>
                      </span>
                      {cancelada ? (
                        <Badge className={info.className}>{info.label}</Badge>
                      ) : (
                        <BadgePagamento pago={!!reserva.pago} />
                      )}
                    </span>
                    <span className={cn("min-w-0", cancelada && "line-through")}>
                      <span className="block truncate font-medium">{reserva.titulo}</span>
                      {reserva.subtitulo && (
                        <span className="block truncate text-sm text-muted-foreground">
                          {reserva.subtitulo}
                        </span>
                      )}
                    </span>
                    {(mostrarStatus || temValor) && (
                      <span className="flex items-center gap-2">
                        {mostrarStatus && <Badge className={info.className}>{info.label}</Badge>}
                        {temValor && (
                          <span className="ml-auto text-sm font-medium tabular-nums">
                            {formatarPreco(reserva.valorCentavos as number)}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                  {!cancelada && (
                    <div className="grid grid-cols-2 gap-2 border-t p-2">
                      {acoes(reserva, "h-10 w-full")}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Quadra</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservasFiltradas.map((reserva) => {
                  const info =
                    STATUS_INFO[reserva.status ?? "CONFIRMADA"] ?? STATUS_INFO.CONFIRMADA;
                  const cancelada = reserva.status === "CANCELADA";

                  return (
                    <TableRow key={reserva.id}>
                      <TableCell className="font-medium whitespace-nowrap tabular-nums">
                        <button
                          type="button"
                          onClick={() => onSelecionarReserva(reserva, reserva.quadraNome)}
                          className="text-left underline-offset-4 outline-none hover:underline focus-visible:underline"
                          aria-label={`Ver reserva das ${minutosParaHora(reserva.inicioMin)} na ${reserva.quadraNome}`}
                        >
                          {minutosParaHora(reserva.inicioMin)}–{minutosParaHora(reserva.fimMin)}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{reserva.quadraNome}</TableCell>
                      <TableCell className={cn("max-w-56", cancelada && "line-through")}>
                        <span className="block truncate">{reserva.titulo}</span>
                        {reserva.subtitulo && (
                          <span className="block truncate text-xs text-muted-foreground">{reserva.subtitulo}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {typeof reserva.valorCentavos === "number" ? formatarPreco(reserva.valorCentavos) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={info.className}>{info.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {cancelada ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <BadgePagamento pago={!!reserva.pago} />
                        )}
                      </TableCell>
                      <TableCell>
                        {!cancelada && (
                          <div className="flex justify-end gap-2">{acoes(reserva)}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function BadgePagamento({ pago }: { pago: boolean }) {
  return (
    <Badge
      variant={pago ? "outline" : "default"}
      className={pago ? "" : "bg-warning text-warning-foreground"}
    >
      {pago ? "Pago" : "A pagar"}
    </Badge>
  );
}
