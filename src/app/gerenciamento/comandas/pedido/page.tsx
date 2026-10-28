import { listarComandasAbertas } from "@/features/comandas/actions/listar-comandas";
import { listarProdutosParaLancar } from "@/features/produtos/actions/listar-produtos";
import { listarOpcoes } from "@/features/selects/actions/listar-opcoes";
import { GRUPO_CATEGORIA_PRODUTO } from "@/features/selects/grupos";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import { ComandasNav } from "@/components/gerenciamento/comandas/comandas-nav";
import { PedidoBalcao } from "@/components/gerenciamento/comandas/pedido-balcao";

// Pedido primeiro, comanda depois: escolhe produtos e quantidades na grade e
// só no fim diz de quem é (docs/COMANDAS.md, "Tela Pedido").
export default async function PedidoPage() {
  const [produtos, comandas, ehAdmin] = await Promise.all([
    listarProdutosParaLancar(),
    listarComandasAbertas(),
    exigirSomenteAdmin().then(Boolean),
  ]);
  // Só o ADMIN cadastra produto (ver exigirSomenteAdmin); o operador do
  // balcão não recebe as categorias e por isso não vê o card de adicionar.
  const categoriasProduto = ehAdmin ? await listarOpcoes(GRUPO_CATEGORIA_PRODUTO) : undefined;

  // Altura da tela menos topbar e paddings do layout: a busca e o rodapé
  // ficam parados e só a lista de produtos rola. No celular desconta topbar
  // (4rem), pt-4 e a barra inferior (4rem + safe area), e o -mb-8 come a
  // sobra do pb-24 do layout pra o rodapé encostar na barra inferior. O
  // título some no celular (as abas já dizem onde está) pra sobrar lista.
  return (
    <div className="-mb-8 flex h-[calc(100dvh_-_9rem_-_env(safe-area-inset-bottom))] min-h-[24rem] flex-col gap-3 md:mb-0 md:h-[calc(100dvh-6.5rem)] md:gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold max-md:sr-only">Comandas</h1>
        <ComandasNav />
      </div>
      <PedidoBalcao produtos={produtos} comandas={comandas} categoriasProduto={categoriasProduto} />
    </div>
  );
}
