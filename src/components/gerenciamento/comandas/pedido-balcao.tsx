"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradeProdutos } from "@/components/gerenciamento/comandas/grade-produtos";
import { VendaAvulsaDialog } from "@/components/gerenciamento/comandas/venda-avulsa-dialog";
import { formatarPreco } from "@/lib/format";
import { normalizarNomeComanda, temNomeESobrenome } from "@/lib/comanda";
import { lancarPedido } from "@/features/comandas/actions/lancar-pedido";
import type { ComandaResumo } from "@/features/comandas/actions/listar-comandas";
import type { ProdutoParaLancar } from "@/features/produtos/actions/listar-produtos";

type Destino = { comandaId: string } | { novoNome: string };

// Chave do carrinho: produto + preço, pra que picolés de valores diferentes
// (preço dinâmico) fiquem em linhas separadas. Produto de preço fixo usa só
// o id.
type ItemCarrinho = { produtoId: string; precoCentavos?: number; quantidade: number };

function chaveCarrinho(produtoId: string, precoCentavos?: number) {
  return precoCentavos === undefined ? produtoId : `${produtoId}|${precoCentavos}`;
}
type Etapa = "produtos" | "revisao" | "comanda";

// Pedido em três etapas: (1) toca nos produtos da grade, cada toque soma 1;
// (2) revisa quantidades e total; (3) escolhe de quem é a comanda. A etapa 3
// é uma tela normal (não modal) pra não ficar embaixo do teclado no celular,
// nem esconder a listagem de comandas abertas. O carrinho fica só no
// navegador até ser adicionado; depois, limpa e volta pra etapa 1.
export function PedidoBalcao({
  produtos,
  comandas,
  categoriasProduto,
}: {
  produtos: ProdutoParaLancar[];
  comandas: ComandaResumo[];
  categoriasProduto?: string[];
}) {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("produtos");
  // Onde a lista de produtos estava, pra voltar no mesmo ponto da grade.
  const rolagemProdutos = useRef(0);
  const [carrinho, setCarrinho] = useState<Record<string, ItemCarrinho>>({});
  const [buscaComanda, setBuscaComanda] = useState("");
  const [vendaAvulsaAberto, setVendaAvulsaAberto] = useState(false);
  const [pendente, startTransition] = useTransition();

  const porId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);
  // Ordem de inserção do objeto = ordem em que o operador tocou.
  const itens = Object.entries(carrinho).flatMap(([chave, { produtoId, precoCentavos, quantidade }]) => {
    const produto = porId.get(produtoId);
    if (!produto) return [];
    return [{ chave, produto, quantidade, precoCentavos, preco: precoCentavos ?? produto.precoCentavos }];
  });
  // Badge da grade: soma por produto, juntando os preços diferentes.
  const quantidades = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const { produtoId, quantidade } of Object.values(carrinho)) {
      mapa[produtoId] = (mapa[produtoId] ?? 0) + quantidade;
    }
    return mapa;
  }, [carrinho]);
  const total = itens.reduce((soma, i) => soma + i.quantidade * i.preco, 0);
  const qtdTotal = itens.reduce((soma, i) => soma + i.quantidade, 0);
  const resumo = `${qtdTotal} ${qtdTotal === 1 ? "item" : "itens"} · ${formatarPreco(total)}`;
  const itensParaLancar = itens.map((i) => ({
    produtoId: i.produto.id,
    quantidade: i.quantidade,
    precoCentavos: i.precoCentavos,
  }));

  const termoComanda = normalizarNomeComanda(buscaComanda);
  const comandasFiltradas = useMemo(
    () =>
      termoComanda
        ? comandas.filter((c) => normalizarNomeComanda(c.nome).includes(termoComanda))
        : comandas,
    [comandas, termoComanda]
  );
  const comandaRepetida = comandas.find((c) => normalizarNomeComanda(c.nome) === termoComanda);
  const podeAbrirComanda = temNomeESobrenome(buscaComanda) && !comandaRepetida;

  function irPara(proxima: Etapa) {
    if (etapa === "produtos") rolagemProdutos.current = window.scrollY;
    setEtapa(proxima);
    const topo = proxima === "produtos" ? rolagemProdutos.current : 0;
    requestAnimationFrame(() => window.scrollTo({ top: topo }));
  }

  function alterar(chave: string, delta: number, novo?: Omit<ItemCarrinho, "quantidade">) {
    setCarrinho((atual) => {
      const item = atual[chave] ?? (novo && { ...novo, quantidade: 0 });
      if (!item) return atual;
      const quantidade = Math.min(99, item.quantidade + delta);
      if (quantidade > 0) return { ...atual, [chave]: { ...item, quantidade } };
      const resto = { ...atual };
      delete resto[chave];
      return resto;
    });
  }

  function adicionarProduto(produtoId: string, precoCentavos?: number) {
    alterar(chaveCarrinho(produtoId, precoCentavos), 1, { produtoId, precoCentavos });
  }

  // "−" do card: tira do último lançado daquele produto (no preço dinâmico
  // pode haver mais de uma linha).
  function diminuirProduto(produtoId: string) {
    const chave = Object.keys(carrinho).findLast((c) => carrinho[c].produtoId === produtoId);
    if (chave) alterar(chave, -1);
  }

  function adicionar(destino: Destino) {
    startTransition(async () => {
      const resultado = await lancarPedido({ ...destino, itens: itensParaLancar });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
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
      setBuscaComanda("");
      irPara("produtos");
      router.refresh();
    });
  }

  function enviarComanda(e: React.FormEvent) {
    e.preventDefault();
    if (pendente) return;
    if (comandaRepetida) adicionar({ comandaId: comandaRepetida.id });
    else if (podeAbrirComanda) adicionar({ novoNome: buscaComanda });
  }

  function vendaAvulsaConcluida() {
    setCarrinho({});
    setBuscaComanda("");
    irPara("produtos");
    router.refresh();
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
          quantidades={quantidades}
          textoQuantidade="no pedido"
          sempreMostrarBusca
          buscaFixa
          categoriasProduto={categoriasProduto}
          onLancar={(produto, precoCentavos) => adicionarProduto(produto.id, precoCentavos)}
          onDiminuir={(produto) => diminuirProduto(produto.id)}
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
              {itens.map(({ chave, produto, quantidade, preco }) => (
                <li key={chave} className="flex items-center gap-2 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{produto.nome}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {quantidade > 1 && `${quantidade} × ${formatarPreco(preco)} · `}
                      {formatarPreco(quantidade * preco)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Tirar um ${produto.nome}`}
                      onClick={() => alterar(chave, -1)}
                    >
                      <Minus aria-hidden />
                    </Button>
                    <span className="w-6 text-center tabular-nums">{quantidade}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`Mais um ${produto.nome}`}
                      onClick={() => alterar(chave, 1)}
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

      {etapa === "comanda" && (
        <section
          aria-labelledby="comanda-titulo"
          className="mx-auto flex w-full max-w-xl flex-col gap-3"
        >
          <TituloEtapa id="comanda-titulo" numero={3}>
            De quem é o pedido?
          </TituloEtapa>
          <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
            {resumo}
          </p>

          <form onSubmit={enviarComanda} className="flex flex-col gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                aria-label="Nome da pessoa"
                placeholder="Buscar comanda ou nome e sobrenome"
                autoFocus
                autoComplete="off"
                value={buscaComanda}
                onChange={(e) => setBuscaComanda(e.target.value)}
                className="h-11 pl-9"
              />
            </div>
            {/* Sempre visível: sem nome digitado fica desabilitado, mas deixa
                claro que dá pra abrir uma comanda nova daqui. */}
            <Button
              type="submit"
              variant={podeAbrirComanda ? "default" : "outline"}
              className="h-11"
              disabled={!podeAbrirComanda || pendente}
            >
              <Plus aria-hidden />
              {pendente
                ? "Adicionando…"
                : podeAbrirComanda
                  ? `Nova comanda “${buscaComanda.trim()}”`
                  : "Nova comanda"}
            </Button>
            {comandaRepetida ? (
              <p className="flex items-start gap-2 text-sm text-muted-foreground" aria-live="polite">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                Já existe comanda aberta para &quot;{comandaRepetida.nome}&quot;. Toque nela abaixo ou
                acrescente um sobrenome ou apelido para abrir outra.
              </p>
            ) : (
              !podeAbrirComanda && (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {termoComanda
                    ? "Para abrir uma comanda nova, digite também o sobrenome."
                    : "Digite nome e sobrenome da pessoa para abrir uma comanda nova."}
                </p>
              )
            )}
          </form>

          <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-hidden>
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          {/* RF39: cliente de balcão que não vai abrir comanda — recebe e
              fecha na hora, sem precisar de nome. */}
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={pendente}
            onClick={() => setVendaAvulsaAberto(true)}
          >
            <Receipt aria-hidden />
            Venda avulsa — recebe agora
          </Button>

          {comandas.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Nenhuma comanda aberta ainda.
            </p>
          ) : comandasFiltradas.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Nenhuma comanda aberta com esse nome.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {comandasFiltradas.map((comanda) => (
                <li key={comanda.id}>
                  <button
                    type="button"
                    disabled={pendente}
                    onClick={() => adicionar({ comandaId: comanda.id })}
                    className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{comanda.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {comanda.qtdItens} {comanda.qtdItens === 1 ? "item" : "itens"}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatarPreco(comanda.totalCentavos)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Barra de ação da etapa, presa no rodapé da tela — no celular, logo
          acima da barra inferior fixa (h-16 + safe area), senão fica por baixo
          dela. A página toda rola (sem rolagem interna), que é o que o iOS
          trata melhor. */}
      <div className="sticky bottom-[calc(4rem_+_env(safe-area-inset-bottom))] z-20 -mx-4 border-t bg-background px-4 py-2 md:bottom-0 md:-mx-6 md:px-6 md:py-3">
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
          ) : etapa === "revisao" ? (
            <>
              <Button variant="outline" className="h-11" onClick={() => irPara("produtos")}>
                <ArrowLeft aria-hidden />
                <span className="hidden sm:inline">Voltar aos produtos</span>
                <span className="sm:hidden">Voltar</span>
              </Button>
              <Button
                className="h-11 flex-1 sm:ml-auto sm:flex-none"
                disabled={itens.length === 0}
                onClick={() => irPara("comanda")}
              >
                Adicionar à comanda
              </Button>
            </>
          ) : (
            <Button variant="outline" className="h-11" onClick={() => irPara("revisao")}>
              <ArrowLeft aria-hidden />
              Voltar
            </Button>
          )}
        </div>
      </div>

      <VendaAvulsaDialog
        aberto={vendaAvulsaAberto}
        onOpenChange={setVendaAvulsaAberto}
        itens={itensParaLancar}
        resumo={resumo}
        totalCentavos={total}
        onVendida={vendaAvulsaConcluida}
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
        aria-label={`Etapa ${numero} de 3:`}
      >
        {numero}
      </span>
      {children}
    </h2>
  );
}
