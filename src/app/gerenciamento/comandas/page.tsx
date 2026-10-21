import { listarComandasAbertas } from "@/features/comandas/actions/listar-comandas";
import { dataParaISO, contagem } from "@/lib/format";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { ComandasNav } from "@/components/gerenciamento/comandas/comandas-nav";
import { ComandasPainel } from "@/components/gerenciamento/comandas/comandas-painel";

// RF31/RF32: painel de comandas abertas (docs/COMANDAS.md).
export default async function ComandasPage() {
  const comandas = await listarComandasAbertas();

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoLista
        titulo="Comandas"
        contagem={comandas.length > 0 ? contagem(comandas.length, "comanda aberta", "comandas abertas") : "Nenhuma comanda aberta"}
        acao={<ComandasNav />}
      />
      <ComandasPainel comandas={comandas} hojeISO={dataParaISO(new Date())} />
    </div>
  );
}
