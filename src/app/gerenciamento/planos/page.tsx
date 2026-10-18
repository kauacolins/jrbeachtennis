import { listarPlanos, type FiltroPlano } from "@/features/planos/actions/planos";
import { listarProdutosBalcao } from "@/features/produtos/actions/listar-produtos";
import { PlanosLista } from "@/components/gerenciamento/planos/planos-lista";

const FILTROS: FiltroPlano[] = ["ativos", "vencendo", "vencidos"];

// RF20: ativar, renovar e cancelar o mensal no balcão; ver quem venceu.
export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro: bruto } = await searchParams;
  const filtro = FILTROS.includes(bruto as FiltroPlano) ? (bruto as FiltroPlano) : "ativos";
  const [planos, produtos] = await Promise.all([listarPlanos(filtro), listarProdutosBalcao()]);
  const mensal = produtos.find((p) => p.tipo === "MENSAL");

  return (
    <div>
      <PlanosLista planos={planos} filtro={filtro} precoCentavos={mensal?.precoCentavos ?? null} />
    </div>
  );
}
