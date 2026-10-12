"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GradeProdutos } from "@/components/gerenciamento/comandas/grade-produtos";
import { EscolherComandaDialog } from "@/components/gerenciamento/comandas/escolher-comanda-dialog";
import { formatarPreco } from "@/lib/format";
import { lancarPedido } from "@/features/comandas/actions/lancar-pedido";
import type { ComandaResumo } from "@/features/comandas/actions/listar-comandas";
import type { ProdutoParaLancar } from "@/features/produtos/actions/listar-produtos";

type Destino = { comandaId: string } | { novoNome: string };
type Etapa = "produtos" | "revisao";

// Pedido em duas etapas: (1) toca nos produtos da grade, cada toque soma 1;
// (2) revisa quantidades e total e escolhe a comanda. O carrinho fica só no
// navegador até ser adicionado; depois, limpa e volta pra etapa 1.
export function PedidoBalcao({
  produtos,
  comandas,
}: {
  produtos: ProdutoParaLancar[];
  comandas: ComandaResumo[];
}) {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("produtos");
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [escolherAberto, setEscolherAberto] = useState(false);

  const porId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);
  // Ordem de inserção do objeto = ordem em que o operador tocou.
  const itens = Object.entries(carrinho).flatMap(([produtoId, quantidade]) => {
    const produto = porId.get(produtoId);
    return produto ? [{ produto, quantidade }] : [];
  });
  const total = itens.reduce((soma, i) => soma + i.quantidade * i.produto.precoCentavos, 0);
  const qtdTotal = itens.reduce((soma, i) => soma + i.quantidade, 0);
  const resumo = `${qtdTotal} ${qtdTotal === 1 ? "item" : "itens"} · ${formatarPreco(total)}`;

  function irPara(proxima: Etapa) {
    setEtapa(proxima);
    window.scrollTo({ top: 0 });
  }

  function alterar(produtoId: string, delta: number) {
    setCarrinho((atual) => {
      const quantidade = Math.min(99, (atual[produtoId] ?? 0) + delta);
      if (quantidade > 0) return { ...atual, [produtoId]: quantidade };
      const resto = { ...atual };
      delete resto[produtoId];
      return resto;
    });
  }

  async function adicionar(destino: Destino) {
    const resultado = await lancarPedido({
      ...destino,
      itens: itens.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
    });
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return false;
    }
    const nome =
      "novoNome" in destino
        ? destino.novoNome.trim()
        : comandas.find((c) => c.id === destino.comandaId)?.nome;
    toast.success(`Pedido adicionado à comanda de ${nome}.`, {
      action: {
        label: "Ver comanda",
        onClick: () => router.push(`/gerenciamento/comandas/${resultado.comandaId}`),
      },
    });
    setCarrinho({});
    setEscolherAberto(false);
    irPara("produtos");
    router.refresh();
    return true;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Etapa 1 fica montada (só escondida) pra manter busca e categoria ao voltar. */}
      <section
        aria-labelledby="produtos-titulo"
        hidden={etapa !== "produtos"}
        className="flex flex-col gap-3"
      >
        <TituloEtapa id="produtos-titulo" numero={1}>
          Escolha os produtos
        </TituloEtapa>
        <GradeProdutos
          produtos={produtos}
          quantidades={carrinho}
          textoQuantidade="no pedido"
          sempreMostrarBusca
          onLancar={(produto) => alterar(produto.id, 1)}
          onDiminuir={(produto) => alterar(produto.id, -1)}
        />
      </section>

      {etapa === "revisao" && (
        <section
          aria-labelledby="revisao-titulo"
          className="mx-auto flex w-full max-w-xl flex-col gap-3"
        >
          <TituloEtapa id="revisao-titulo" numero={2}>
            Confira o pedido
          </TituloEtapa>

          {itens.length === 0 ? (
            <p className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
              <ShoppingBag className="size-5" aria-hidden />
              O pedido ficou vazio. Volte e escolha os produtos.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {itens.map(({ produto, quantidade }) => (
                <li key={produto.id} className="flex items-center gap-2 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{produto.nome}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {quantidade > 1 && `${quantidade} × ${formatarPreco(produto.precoCentavos)} · `}
                      {formatarPreco(quantidade * produto.precoCentavos)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Tirar um ${produto.nome}`}
                      onClick={() => alterar(produto.id, -1)}
                    >
                      <Minus aria-hidden />
                    </Button>
                    <span className="w-6 text-center tabular-nums">{quantidade}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Mais um ${produto.nome}`}
                      onClick={() => alterar(produto.id, 1)}
                    >
                      <Plus aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-baseline justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-semibold tabular-nums" aria-live="polite">
              {formatarPreco(total)}
            </span>
          </div>
        </section>
      )}

      {/* Barra de ação da etapa, presa no rodapé da tela. */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          {etapa === "produtos" ? (
            <>
              <span className="flex-1 text-sm text-muted-foreground tabular-nums" aria-live="polite">
                {itens.length === 0 ? "Nenhum produto escolhido" : resumo}
              </span>
              {itens.length > 0 && (
                <Button variant="ghost" className="h-11" onClick={() => setCarrinho({})}>
                  Limpar
                </Button>
              )}
              <Button className="h-11" disabled={itens.length === 0} onClick={() => irPara("revisao")}>
                Continuar
                <ArrowRight aria-hidden />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="h-11" onClick={() => irPara("produtos")}>
                <ArrowLeft aria-hidden />
                <span className="hidden sm:inline">Voltar aos produtos</span>
                <span className="sm:hidden">Voltar</span>
              </Button>
              <Button
                className="h-11 flex-1 sm:ml-auto sm:flex-none"
                disabled={itens.length === 0}
                onClick={() => setEscolherAberto(true)}
              >
                Adicionar à comanda
              </Button>
            </>
          )}
        </div>
      </div>

      <EscolherComandaDialog
        aberto={escolherAberto}
        onOpenChange={setEscolherAberto}
        comandas={comandas}
        resumo={resumo}
        onEscolher={adicionar}
      />
    </div>
  );
}

function TituloEtapa({
  id,
  numero,
  children,
}: {
  id: string;
  numero: number;
  children: React.ReactNode;
}) {
  return (
    <h2 id={id} className="flex items-center gap-2 font-medium">
      <span
        className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground tabular-nums"
        aria-label={`Etapa ${numero} de 2:`}
      >
        {numero}
      </span>
      {children}
    </h2>
  );
}
