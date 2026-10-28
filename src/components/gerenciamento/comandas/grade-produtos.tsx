"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatarPreco } from "@/lib/format";
import { FotoProduto } from "@/components/gerenciamento/produtos/foto-produto";
import { ProdutoFormDialog } from "@/components/gerenciamento/produtos/produto-form-dialog";
import { PrecoDinamicoDialog } from "@/components/gerenciamento/comandas/preco-dinamico-dialog";
import type { ProdutoParaLancar } from "@/features/produtos/actions/listar-produtos";

const LIMITE_SEM_BUSCA = 12;

// RF33: cardápio do bar em cards com foto, nome e preço — um toque lança 1.
// Os mais vendidos vêm primeiro (ordem de listarProdutosParaLancar); o
// número no canto mostra quantos daquele produto já estão na comanda, e o
// "−" no canto oposto tira um. Produto de preço dinâmico pede o valor antes
// de lançar (PrecoDinamicoDialog).
export function GradeProdutos({
  produtos,
  quantidades,
  textoQuantidade = "na comanda",
  sempreMostrarBusca = false,
  buscaFixa = false,
  // Card extra no fim da grade pra cadastrar produto sem saída da tela — só
  // o ADMIN recebe essa prop preenchida (ver exigirSomenteAdmin na página);
  // o operador do balcão não cadastra produto.
  categoriasProduto,
  onLancar,
  onDiminuir,
}: {
  produtos: ProdutoParaLancar[];
  quantidades: Record<string, number>;
  textoQuantidade?: string;
  // Sem isso, a busca só aparece com cardápio grande (LIMITE_SEM_BUSCA).
  sempreMostrarBusca?: boolean;
  // Busca e categorias grudam embaixo da topbar enquanto a grade rola.
  buscaFixa?: boolean;
  categoriasProduto?: string[];
  onLancar: (produto: ProdutoParaLancar, precoCentavos?: number) => void;
  onDiminuir?: (produto: ProdutoParaLancar) => void;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [criarAberto, setCriarAberto] = useState(false);
  const [pedindoPreco, setPedindoPreco] = useState<ProdutoParaLancar | null>(null);
  const podeAdicionarProduto = categoriasProduto !== undefined;
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
  // Sem "Todos": já abre filtrado na primeira categoria (nenhuma, se o
  // cardápio não tiver categoria cadastrada — aí mostra tudo).
  const [categoria, setCategoria] = useState<string | null>(() => categorias[0] ?? null);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return ordenados.filter(
      (p) =>
        (categoria === null || p.categoria === categoria) &&
        (!termo || p.nome.toLocaleLowerCase("pt-BR").includes(termo))
    );
  }, [ordenados, busca, categoria]);

  if (produtos.length === 0 && !podeAdicionarProduto) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Nenhum produto do bar cadastrado. O admin cadastra em Produtos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex flex-col gap-3",
          buscaFixa &&
            "sticky top-16 z-10 -mx-4 -mt-3 border-b bg-background px-4 py-3 md:top-14 md:-mx-6 md:px-6"
        )}
      >
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
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={categoria === c}
                onClick={() => setCategoria(c)}
                className={cn(
                  "h-9 shrink-0 snap-start rounded-lg border bg-background px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  categoria === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {visiveis.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
      )}

      {(visiveis.length > 0 || podeAdicionarProduto) && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
          {visiveis.map((produto) => {
            const qtd = quantidades[produto.id] ?? 0;
            return (
              <li key={produto.id} className="relative">
                <button
                  type="button"
                  onClick={() =>
                    produto.precoDinamico ? setPedindoPreco(produto) : onLancar(produto)
                  }
                  title={produto.nome}
                  aria-label={`Lançar ${produto.nome}, ${produto.precoDinamico ? "preço livre" : formatarPreco(produto.precoCentavos)}${qtd > 0 ? `. ${qtd} ${textoQuantidade}` : ""}`}
                  className={cn(
                    "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background text-left transition-[transform,border-color] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97] motion-reduce:active:scale-100",
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
                      className="absolute top-1.5 right-1.5 flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-2 text-base font-bold text-primary-foreground tabular-nums shadow-sm sm:h-7 sm:min-w-7 sm:px-1.5 sm:text-sm"
                      aria-hidden
                    >
                      {qtd}
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 p-2">
                    <span className="truncate text-sm leading-tight font-medium">{produto.nome}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {produto.precoDinamico ? "Preço livre" : formatarPreco(produto.precoCentavos)}
                    </span>
                  </span>
                </button>
                {/* Fora do card: botão dentro de botão não é HTML válido. */}
                {qtd > 0 && onDiminuir && (
                  <button
                    type="button"
                    onClick={() => onDiminuir(produto)}
                    aria-label={`Tirar um ${produto.nome}`}
                    className="absolute top-1.5 left-1.5 flex size-10 items-center justify-center rounded-full border-2 bg-background text-foreground shadow-md transition-transform before:absolute before:-inset-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100 sm:size-8 sm:border"
                  >
                    <Minus className="size-5 sm:size-4" strokeWidth={2.5} aria-hidden />
                  </button>
                )}
              </li>
            );
          })}
          {podeAdicionarProduto && (
            <li>
              <button
                type="button"
                onClick={() => setCriarAberto(true)}
                className="flex aspect-square h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97] motion-reduce:active:scale-100"
              >
                <Plus className="size-5" aria-hidden />
                <span className="text-sm font-medium">Adicionar Produto</span>
              </button>
            </li>
          )}
        </ul>
      )}

      <PrecoDinamicoDialog
        produto={pedindoPreco}
        onOpenChange={(aberto) => !aberto && setPedindoPreco(null)}
        onConfirmar={(precoCentavos) => pedindoPreco && onLancar(pedindoPreco, precoCentavos)}
      />

      {podeAdicionarProduto && (
        <ProdutoFormDialog
          aberto={criarAberto}
          onOpenChange={setCriarAberto}
          produto={null}
          categorias={categoriasProduto ?? []}
          onSalvo={() => router.refresh()}
        />
      )}
    </div>
  );
}
