import { listarComandasAbertas } from "@/features/comandas/actions/listar-comandas";
import { listarProdutosParaLancar } from "@/features/produtos/actions/listar-produtos";
import { ComandasNav } from "@/components/gerenciamento/comandas/comandas-nav";
import { PedidoBalcao } from "@/components/gerenciamento/comandas/pedido-balcao";

// Pedido primeiro, comanda depois: escolhe produtos e quantidades na grade e
// só no fim diz de quem é (docs/COMANDAS.md, "Tela Pedido").
export default async function PedidoPage() {
  const [produtos, comandas] = await Promise.all([
    listarProdutosParaLancar(),
    listarComandasAbertas(),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Comandas</h1>
        <ComandasNav />
      </div>
      <PedidoBalcao produtos={produtos} comandas={comandas} />
    </div>
  );
}
