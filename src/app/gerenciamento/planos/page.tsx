import { listarPlanos, type FiltroPlano } from "@/features/planos/actions/planos";
import { listarProdutosBalcao } from "@/features/produtos/actions/listar-produtos";
import { PlanosLista } from "@/components/gerenciamento/planos/planos-lista";
import { PIX_CHAVE_ARENA, PIX_TITULAR_ARENA } from "@/lib/constants";

const FILTROS: FiltroPlano[] = ["todos", "ativos", "vencendo", "vencidos"];

// RF20: ativar, renovar e cancelar o mensal no balcão; ver quem venceu.
export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro: bruto } = await searchParams;
  const filtro = FILTROS.includes(bruto as FiltroPlano) ? (bruto as FiltroPlano) : "ativos";
  // Busca todos e filtra no componente: as abas mostram a contagem de cada situação.
  const [planos, produtos] = await Promise.all([listarPlanos("todos"), listarProdutosBalcao()]);
  const mensal = produtos.find((p) => p.tipo === "MENSAL");

  return (
    <div>
      <PlanosLista
        planos={planos}
        filtro={filtro}
        precoCentavos={mensal?.precoCentavos ?? null}
        pix={PIX_CHAVE_ARENA && PIX_TITULAR_ARENA ? { chave: PIX_CHAVE_ARENA, titular: PIX_TITULAR_ARENA } : null}
      />
    </div>
  );
}
