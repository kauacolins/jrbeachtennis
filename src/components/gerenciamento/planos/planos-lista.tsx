"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, MessageCircle, Phone, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { BuscarCliente } from "@/components/gerenciamento/balcao/buscar-cliente";
import { SeletorMetodo } from "@/components/gerenciamento/balcao/seletor-metodo";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { mensagemRenovacaoPlano } from "@/components/gerenciamento/clientes/mensagens-cliente";
import type { PixArena } from "@/components/gerenciamento/reserva-detalhe-painel";
import { filtrarPorBusca } from "@/lib/busca";
import { cn } from "@/lib/utils";
import { linkWhatsapp } from "@/lib/whatsapp";
import { contagem, formatarDataCurta, formatarPreco, formatarTelefone } from "@/lib/format";
import { ativarPlano, cancelarPlano, type FiltroPlano, type PlanoLinha } from "@/features/planos/actions/planos";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";

const ABAS: { valor: FiltroPlano; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "ativos", label: "Ativos" },
  { valor: "vencendo", label: "Vencendo" },
  { valor: "vencidos", label: "Vencidos" },
];

const VAZIO: Record<FiltroPlano, string> = {
  todos: "Ninguém teve plano mensal ainda.",
  ativos: "Nenhum plano mensal ativo.",
  vencendo: "Nenhum plano vence nos próximos 7 dias.",
  vencidos: "Ninguém com plano vencido.",
};

const CONTAGEM_SINGULAR: Record<FiltroPlano, string> = {
  todos: "plano",
  ativos: "plano ativo",
  vencendo: "plano vencendo",
  vencidos: "plano vencido",
};

const CONTAGEM_PLURAL: Record<FiltroPlano, string> = {
  todos: "planos",
  ativos: "planos ativos",
  vencendo: "planos vencendo",
  vencidos: "planos vencidos",
};

// Sinalizador do card: verde = em dia, laranja = vence em até 7 dias,
// vermelho = não renovado (venceu ou foi cancelado). A bolinha ao lado do
// nome dá pra varrer a grade de relance; o badge diz a situação por extenso.
function situacaoPlano(plano: PlanoLinha) {
  if (plano.vencendo) {
    return {
      label: "Vence em breve",
      ponto: "bg-warning",
      badge: "bg-warning/15 text-foreground",
    };
  }
  if (plano.ativo) {
    return {
      label: "Em dia",
      ponto: "bg-primary",
      badge: "bg-accent text-accent-foreground",
    };
  }
  return {
    label: plano.cancelado ? "Cancelado" : "Não renovado",
    ponto: "bg-destructive",
    badge: "bg-destructive/10 text-destructive",
  };
}

// RF20: o mensal é vendido no balcão e já entra pago. Renovar começa no fim
// do plano atual, então dá pra renovar antes de vencer sem perder dias.
export function PlanosLista({
  planos: todos,
  filtro,
  precoCentavos,
  pix,
}: {
  planos: PlanoLinha[];
  filtro: FiltroPlano;
  precoCentavos: number | null;
  pix: PixArena | null;
}) {
  const router = useRouter();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [cliente, setCliente] = useState<{ id: string; nome: string } | null>(null);
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [pendente, startTransition] = useTransition();
  const [busca, setBusca] = useState("");
  const porFiltro: Record<FiltroPlano, PlanoLinha[]> = {
    todos,
    ativos: todos.filter((p) => p.ativo),
    vencendo: todos.filter((p) => p.vencendo),
    // Vencidos: o mais recente primeiro (o resto vem do mais perto de vencer).
    vencidos: todos.filter((p) => !p.ativo).reverse(),
  };
  const planos = porFiltro[filtro];
  const visiveis = filtrarPorBusca(planos, busca, (p) => [p.nome, p.telefone]);

  function abrir(paraCliente: { id: string; nome: string } | null) {
    setCliente(paraCliente);
    setMetodo(null);
    setDialogAberto(true);
  }

  function confirmar() {
    if (!cliente || !metodo) return;
    startTransition(async () => {
      const resultado = await ativarPlano({ clienteId: cliente.id, metodo });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(`Mensal de ${cliente.nome} vale até ${formatarDataCurta(resultado.fim)}.`);
      setDialogAberto(false);
      router.refresh();
    });
  }

  function cancelar(clienteId: string) {
    startTransition(async () => {
      const resultado = await cancelarPlano(clienteId);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Plano cancelado.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoLista
        titulo="Planos mensais"
        contagem={
          planos.length > 0
            ? contagem(planos.length, CONTAGEM_SINGULAR[filtro], CONTAGEM_PLURAL[filtro])
            : undefined
        }
        acao={
          <Button size="lg" className="h-11 px-5 text-base" onClick={() => abrir(null)}>
            <Plus className="size-5" aria-hidden />
            Ativar plano
          </Button>
        }
      />

      <nav aria-label="Situação do plano" className="flex gap-1 overflow-x-auto">
        {ABAS.map((aba) => (
          <Link
            key={aba.valor}
            href={`/gerenciamento/planos?filtro=${aba.valor}`}
            aria-current={aba.valor === filtro ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              aba.valor === filtro
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {aba.label}
            <span
              className={cn(
                "min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums",
                aba.valor === filtro ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              )}
            >
              {porFiltro[aba.valor].length}
            </span>
          </Link>
        ))}
      </nav>

      {planos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <CalendarCheck className="size-6" aria-hidden />
          {VAZIO[filtro]}
        </div>
      ) : (
        <>
          <CampoBusca
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome ou telefone"
            ariaLabel="Buscar plano"
          />
          {visiveis.length === 0 ? (
            <SemResultadoBusca busca={busca} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visiveis.map((plano) => {
                const situacao = situacaoPlano(plano);
                const hrefMensagem = plano.telefone
                  ? linkWhatsapp(
                      plano.telefone,
                      mensagemRenovacaoPlano({
                        nome: plano.nome,
                        fim: new Date(plano.fim),
                        vencido: !plano.ativo,
                        precoCentavos,
                        pix,
                      })
                    )
                  : null;
                return (
                  <li
                    key={plano.id}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className={cn("size-2.5 shrink-0 rounded-full", situacao.ponto)}
                            aria-hidden
                          />
                          <span className="truncate font-semibold">{plano.nome}</span>
                        </span>
                        <span className="flex items-center gap-1.5 pl-[18px] text-xs text-muted-foreground tabular-nums">
                          <Phone className="size-3" aria-hidden />
                          {plano.telefone ? formatarTelefone(plano.telefone) : "Sem telefone"}
                        </span>
                      </div>
                      <Badge className={cn("shrink-0 rounded-full text-[11px]", situacao.badge)}>
                        {situacao.label}
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {plano.ativo
                          ? `Vale até ${formatarDataCurta(plano.fim)}`
                          : plano.cancelado
                            ? `Cancelado (ia até ${formatarDataCurta(plano.fim)})`
                            : `Venceu ${formatarDataCurta(plano.fim)}`}
                      </span>
                      {plano.ativo && (
                        <span className="font-heading text-lg font-bold tabular-nums">
                          {contagem(plano.diasRestantes, "dia", "dias")}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="h-10"
                        onClick={() => abrir({ id: plano.clienteId, nome: plano.nome })}
                      >
                        <RefreshCw aria-hidden />
                        Renovar
                      </Button>
                      {hrefMensagem ? (
                        <Button
                          variant="outline"
                          size="lg"
                          className="h-10"
                          nativeButton={false}
                          render={<a href={hrefMensagem} target="_blank" rel="noopener noreferrer" />}
                          aria-label={`Mandar mensagem de renovação para ${plano.nome}`}
                        >
                          <MessageCircle aria-hidden />
                          Mensagem
                        </Button>
                      ) : (
                        <Button variant="outline" size="lg" className="h-10" disabled title="Cliente sem telefone">
                          <MessageCircle aria-hidden />
                          Mensagem
                        </Button>
                      )}
                    </div>
                    {plano.ativo && (
                      <ConfirmarBotao
                        size="sm"
                        variant="ghost"
                        actionVariant="destructive"
                        className="-mt-1 self-center text-muted-foreground"
                        label="Cancelar plano"
                        titulo={`Cancelar o mensal de ${plano.nome}?`}
                        descricao="O day use deixa de sair por R$ 0 a partir de agora. Não há estorno automático."
                        textoConfirmar="Cancelar plano"
                        textoConfirmando="Cancelando…"
                        disabled={pendente}
                        onConfirmar={() => cancelar(plano.clienteId)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cliente ? `Mensal de ${cliente.nome}` : "Ativar plano mensal"}</DialogTitle>
            <DialogDescription>
              {cliente
                ? "Se o plano ainda está ativo, os 30 dias novos começam quando ele vencer."
                : "Busque o cliente ou faça o cadastro rápido."}
            </DialogDescription>
          </DialogHeader>

          {!cliente ? (
            dialogAberto && (
              <BuscarCliente acaoLabel="Escolher" onSelecionar={(c) => setCliente({ id: c.id, nome: c.nome })} />
            )
          ) : (
            <>
              {precoCentavos !== null && (
                <p className="text-center text-3xl font-semibold tabular-nums">
                  {formatarPreco(precoCentavos)}
                </p>
              )}
              <SeletorMetodo valor={metodo} onChange={setMetodo} />
              <DialogFooter>
                <Button className="h-11 w-full" disabled={!metodo || pendente} onClick={confirmar}>
                  {pendente ? "Salvando…" : "Confirmar pagamento"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
