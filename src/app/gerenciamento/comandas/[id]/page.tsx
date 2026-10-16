import { notFound } from "next/navigation";
import { obterComanda } from "@/features/comandas/actions/listar-comandas";
import { listarProdutosParaLancar } from "@/features/produtos/actions/listar-produtos";
import { listarOpcoes } from "@/features/selects/actions/listar-opcoes";
import { GRUPO_CATEGORIA_PRODUTO } from "@/features/selects/grupos";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import { dataParaISO } from "@/lib/format";
import { ComandaDetalhe } from "@/components/gerenciamento/comandas/comanda-detalhe";

// RF33–RF38: lançar itens, day use e reserva; receber e fechar.
export default async function ComandaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [comanda, produtos, ehAdmin] = await Promise.all([
    obterComanda(id),
    listarProdutosParaLancar(),
    exigirSomenteAdmin().then(Boolean),
  ]);
  if (!comanda) notFound();
  // Só o ADMIN cadastra produto (ver exigirSomenteAdmin); o operador do
  // balcão não recebe as categorias e por isso não vê o card de adicionar.
  const categoriasProduto = ehAdmin ? await listarOpcoes(GRUPO_CATEGORIA_PRODUTO) : undefined;

  return (
    <div className="px-4 py-6">
      <ComandaDetalhe
        comanda={comanda}
        produtos={produtos}
        hojeISO={dataParaISO(new Date())}
        categoriasProduto={categoriasProduto}
      />
    </div>
  );
}
