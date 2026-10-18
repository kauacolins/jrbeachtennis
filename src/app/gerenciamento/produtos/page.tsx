import { redirect } from "next/navigation";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import {
  listarProdutosBalcao,
  listarProdutosBarAdmin,
} from "@/features/produtos/actions/listar-produtos";
import { listarOpcoes } from "@/features/selects/actions/listar-opcoes";
import { GRUPO_CATEGORIA_PRODUTO } from "@/features/selects/grupos";
import { ProdutosBalcaoForm } from "@/components/gerenciamento/produtos/produtos-balcao-form";
import { ProdutosBarLista } from "@/components/gerenciamento/produtos/produtos-bar-lista";

// RF17 + RF30: preços do day use e do mensal, limite diário e cardápio do
// bar. Só ADMIN — o operador não mexe em preço.
export default async function ProdutosPage() {
  if (!(await exigirSomenteAdmin())) redirect("/gerenciamento");

  const [balcao, bar, categorias] = await Promise.all([
    listarProdutosBalcao(),
    listarProdutosBarAdmin(),
    listarOpcoes(GRUPO_CATEGORIA_PRODUTO),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <ProdutosBalcaoForm produtos={balcao} />
      <ProdutosBarLista produtos={bar} categorias={categorias} />
    </div>
  );
}
