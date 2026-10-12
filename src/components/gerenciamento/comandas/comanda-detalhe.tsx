"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronLeft, Minus, Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { DayUseComandaDialog } from "@/components/gerenciamento/comandas/day-use-comanda-dialog";
import { ReservaComandaDialog } from "@/components/gerenciamento/comandas/reserva-comanda-dialog";
import { FecharComandaDialog } from "@/components/gerenciamento/comandas/fechar-comanda-dialog";
import { GradeProdutos } from "@/components/gerenciamento/comandas/grade-produtos";
import { dataParaISO, formatarDataCurta, formatarHora, formatarPreco } from "@/lib/format";
import { rotuloMetodo } from "@/lib/pagamento";
import { diminuirItem, lancarProdutoBar, removerItemComanda } from "@/features/comandas/actions/lancar-item";
import { cancelarComanda } from "@/features/comandas/actions/fechar-comanda";
import type { ComandaDetalhe as ComandaDetalheDados } from "@/features/comandas/actions/listar-comandas";
import type { ProdutoParaLancar } from "@/features/produtos/actions/listar-produtos";

// RF33–RF38: tela de uma comanda. Toque no produto lança 1 (preço congelado
// no servidor); day use e reserva abrem um diálogo próprio. Cada mutação
// volta do servidor já com o total recalculado (router.refresh()).
export function ComandaDetalhe({
  comanda,
  produtos,
  hojeISO,
}: {
  comanda: ComandaDetalheDados;
  produtos: ProdutoParaLancar[];
  hojeISO: string;
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [dayUseAberto, setDayUseAberto] = useState(false);
  const [reservaAberto, setReservaAberto] = useState(false);
  const [fecharAberto, setFecharAberto] = useState(false);

  const aberta = comanda.status === "ABERTA";
  const deOutroDia = dataParaISO(comanda.abertaEm) !== hojeISO;

  // Quantos de cada produto já estão na comanda (badge do card). O toque soma
  // na hora (useOptimistic) e o valor real chega com o router.refresh().
  const quantidadesReais = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const item of comanda.itens) {
      if (item.produtoId) mapa[item.produtoId] = (mapa[item.produtoId] ?? 0) + item.quantidade;
    }
    return mapa;
  }, [comanda.itens]);
  const [quantidades, somarOtimista] = useOptimistic(
    quantidadesReais,
    (atual, produtoId: string) => ({ ...atual, [produtoId]: (atual[produtoId] ?? 0) + 1 })
  );

  function executar(
    acao: () => Promise<{ ok: true } | { ok: false; erro: string }>,
    antes?: () => void
  ) {
    startTransition(async () => {
      antes?.();
      const resultado = await acao();
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      router.refresh();
    });
  }

  function cancelar() {
    startTransition(async () => {
      const resultado = await cancelarComanda(comanda.id);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Comanda cancelada.");
      router.push("/gerenciamento/comandas");
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-24 lg:pb-0">
      <div className="flex flex-col gap-1">
        <Link
          href="/gerenciamento/comandas"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Comandas
        </Link>
        <h1 className="font-heading text-2xl font-bold">{comanda.nome}</h1>
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {deOutroDia ? (
            <Badge className="bg-warning text-warning-foreground">
              Aberta em {formatarDataCurta(comanda.abertaEm)}, falta fechar
            </Badge>
          ) : (
            <>Aberta às {formatarHora(comanda.abertaEm)}</>
          )}
          {comanda.status === "FECHADA" && (
            <Badge variant="secondary">
              Paga · {rotuloMetodo(comanda.metodo)}
              {comanda.fechadaEm && ` · ${formatarHora(comanda.fechadaEm)}`}
            </Badge>
          )}
          {comanda.status === "CANCELADA" && <Badge variant="destructive">Cancelada</Badge>}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-start">
        {aberta && (
          <section aria-labelledby="lancar-titulo" className="flex flex-col gap-3 rounded-xl border bg-background p-4">
            <h2 id="lancar-titulo" className="font-medium">
              Lançar
            </h2>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-11" onClick={() => setDayUseAberto(true)}>
                <Ticket aria-hidden />
                Day use
              </Button>
              <Button variant="outline" className="h-11" onClick={() => setReservaAberto(true)}>
                <CalendarClock aria-hidden />
                Reserva de hoje
              </Button>
            </div>

            <GradeProdutos
              produtos={produtos}
              quantidades={quantidades}
              onLancar={(produto) =>
                executar(
                  () => lancarProdutoBar(comanda.id, produto.id),
                  () => somarOtimista(produto.id)
                )
              }
            />
          </section>
        )}

        <div className="flex flex-col gap-3 lg:sticky lg:top-28">
          <section
            aria-labelledby="itens-titulo"
            className="flex flex-col gap-3 rounded-xl border bg-background p-4"
          >
            <h2 id="itens-titulo" className="font-medium">
              Consumo
            </h2>

            {comanda.itens.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nada lançado ainda.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {comanda.itens.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.descricao}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {item.quantidade > 1 && `${item.quantidade} × ${formatarPreco(item.precoUnitarioCentavos)} · `}
                        {formatarPreco(item.quantidade * item.precoUnitarioCentavos)}
                      </p>
                    </div>
                    {aberta && item.tipo === "BAR" && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Tirar um ${item.descricao}`}
                          onClick={() => executar(() => diminuirItem(item.id))}
                        >
                          <Minus aria-hidden />
                        </Button>
                        <span className="w-6 text-center tabular-nums">{item.quantidade}</span>
                        {item.produtoId && (
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Mais um ${item.descricao}`}
                            onClick={() => executar(() => lancarProdutoBar(comanda.id, item.produtoId!))}
                          >
                            <Plus aria-hidden />
                          </Button>
                        )}
                      </div>
                    )}
                    {aberta && item.tipo !== "BAR" && (
                      <ConfirmarBotao
                        size="icon"
                        variant="ghost"
                        actionVariant="destructive"
                        label={<Trash2 aria-label={`Remover ${item.descricao}`} />}
                        titulo="Remover da comanda?"
                        descricao={
                          item.tipo === "DAY_USE"
                            ? "O day use dessa pessoa é cancelado."
                            : "A reserva continua na agenda, como não paga."
                        }
                        textoConfirmar="Remover"
                        textoConfirmando="Removendo…"
                        disabled={pendente}
                        onConfirmar={() => executar(() => removerItemComanda(item.id))}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-baseline justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-semibold tabular-nums" aria-live="polite">
                {formatarPreco(comanda.totalCentavos)}
              </span>
            </div>

            {aberta && (
              <Button
                className="hidden h-11 lg:inline-flex"
                disabled={comanda.itens.length === 0 || pendente}
                onClick={() => setFecharAberto(true)}
              >
                Receber e fechar
              </Button>
            )}
          </section>

          {/* Num bloco próprio abaixo do consumo, longe do "Receber e fechar":
              é destrutivo e raro, então não fica no topo da tela. */}
          {aberta && (
            <div className="flex justify-center rounded-xl border bg-background p-2">
              <ConfirmarBotao
                size="sm"
                variant="ghost"
                actionVariant="destructive"
                className="text-destructive hover:text-destructive"
                label="Cancelar comanda"
                titulo="Cancelar essa comanda?"
                descricao="Os day use dela são cancelados e as reservas voltam para 'a pagar' na agenda. Não dá para desfazer."
                textoConfirmar="Cancelar comanda"
                textoConfirmando="Cancelando…"
                disabled={pendente}
                onConfirmar={cancelar}
              />
            </div>
          )}
        </div>
      </div>

      {aberta && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <Button
            className="h-11 w-full"
            disabled={comanda.itens.length === 0 || pendente}
            onClick={() => setFecharAberto(true)}
          >
            Receber e fechar · {formatarPreco(comanda.totalCentavos)}
          </Button>
        </div>
      )}

      <DayUseComandaDialog
        aberto={dayUseAberto}
        onOpenChange={setDayUseAberto}
        comandaId={comanda.id}
        nomeComanda={comanda.nome}
        onAdicionado={() => router.refresh()}
      />
      <ReservaComandaDialog
        aberto={reservaAberto}
        onOpenChange={setReservaAberto}
        comandaId={comanda.id}
        onAdicionado={() => router.refresh()}
      />
      <FecharComandaDialog
        aberto={fecharAberto}
        onOpenChange={setFecharAberto}
        comanda={comanda}
        onFechada={() => router.refresh()}
      />
    </div>
  );
}
