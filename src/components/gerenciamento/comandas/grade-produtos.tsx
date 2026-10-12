"use client";

import { useMemo, useState } from "react";
import { Minus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatarPreco } from "@/lib/format";
import { FotoProduto } from "@/components/gerenciamento/produtos/foto-produto";
import type { ProdutoParaLancar } from "@/features/produtos/actions/listar-produtos";

const LIMITE_SEM_BUSCA = 12;
const TODAS = "__todas__";

// RF33: cardápio do bar em cards com foto, nome e preço — um toque lança 1.
// Os mais vendidos vêm primeiro (ordem de listarProdutosParaLancar); o
// número no canto mostra quantos daquele produto já estão na comanda, e o
// "−" no canto oposto tira um.
export function GradeProdutos({
  produtos,
  quantidades,
  textoQuantidade = "na comanda",
  sempreMostrarBusca = false,
  onLancar,
  onDiminuir,
}: {
  produtos: ProdutoParaLancar[];
  quantidades: Record<string, number>;
  textoQuantidade?: string;
  // Sem isso, a busca só aparece com cardápio grande (LIMITE_SEM_BUSCA).
  sempreMostrarBusca?: boolean;
  onLancar: (produto: ProdutoParaLancar) => void;
  onDiminuir?: (produto: ProdutoParaLancar) => void;
}) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState(TODAS);
  // A ordem de "mais vendidos" muda a cada lançamento (o servidor recalcula);
  // trava a ordem da primeira renderização pra o card não pular de lugar
  // entre um toque e outro. Produto novo vai pro fim.
  const [ordemInicial] = useState(() => new Map(produtos.map((p, i) => [p.id, i])));
  const ordenados = useMemo(
    () =>
      [...produtos].sort(
        (a, b) =>
          (ordemInicial.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (ordemInicial.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      ),
    [produtos, ordemInicial]
  );

  const categorias = useMemo(
    () =>
      [...new Set(produtos.map((p) => p.categoria).filter((c): c is string => Boolean(c)))].sort(
        (a, b) => a.localeCompare(b, "pt-BR")
      ),
    [produtos]
  );

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return ordenados.filter(
      (p) =>
        (categoria === TODAS || p.categoria === categoria) &&
        (!termo || p.nome.toLocaleLowerCase("pt-BR").includes(termo))
    );
  }, [ordenados, busca, categoria]);

  if (produtos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Nenhum produto do bar cadastrado. O admin cadastra em Produtos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {(sempreMostrarBusca || produtos.length > LIMITE_SEM_BUSCA) && (
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            aria-label="Buscar produto"
            placeholder="Buscar produto"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
      )}

      {categorias.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Categoria"
          className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1"
        >
          {[{ valor: TODAS, label: "Todos" }, ...categorias.map((c) => ({ valor: c, label: c }))].map(
            ({ valor, label }) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={categoria === valor}
                onClick={() => setCategoria(valor)}
                className={cn(
                  "h-9 shrink-0 snap-start rounded-lg border bg-background px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  categoria === valor
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {label}
              </button>
            )
          )}
        </div>
      )}

      {visiveis.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
          {visiveis.map((produto) => {
            const qtd = quantidades[produto.id] ?? 0;
            return (
              <li key={produto.id} className="relative">
                <button
                  type="button"
                  onClick={() => onLancar(produto)}
                  aria-label={`Lançar ${produto.nome}, ${formatarPreco(produto.precoCentavos)}${qtd > 0 ? `. ${qtd} ${textoQuantidade}` : ""}`}
                  className={cn(
                    "group relative flex w-full flex-col overflow-hidden rounded-xl border bg-background text-left transition-[transform,border-color] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97] motion-reduce:active:scale-100",
                    qtd > 0 && "border-primary"
                  )}
                >
                  <FotoProduto
                    fotoUrl={produto.fotoUrl}
                    nome=""
                    sizes="(min-width: 1280px) 160px, (min-width: 640px) 25vw, 33vw"
                    className="aspect-square w-full"
                  />
                  {qtd > 0 && (
                    <span
                      className="absolute top-1.5 right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums shadow-sm"
                      aria-hidden
                    >
                      {qtd}
                    </span>
                  )}
                  <span className="flex flex-1 flex-col gap-0.5 p-2">
                    <span className="line-clamp-2 text-sm leading-tight font-medium">{produto.nome}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatarPreco(produto.precoCentavos)}
                    </span>
                  </span>
                </button>
                {/* Fora do card: botão dentro de botão não é HTML válido. */}
                {qtd > 0 && onDiminuir && (
                  <button
                    type="button"
                    onClick={() => onDiminuir(produto)}
                    aria-label={`Tirar um ${produto.nome}`}
                    className="absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-transform before:absolute before:-inset-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
                  >
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
