import { listarHistoricoComandas } from "@/features/comandas/actions/listar-comandas";
import { dataParaISO, formatarPreco } from "@/lib/format";
import { rotuloMetodo } from "@/lib/pagamento";
import { ComandasNav } from "@/components/gerenciamento/comandas/comandas-nav";
import { HistoricoComandasLista } from "@/components/gerenciamento/comandas/historico-comandas-lista";
import { NavegacaoDia } from "@/components/gerenciamento/balcao/navegacao-dia";

// RF35: comandas fechadas/canceladas do dia, com o total vendido e quanto
// entrou por forma de pagamento (pra conferir o caixa).
export default async function HistoricoComandasPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data } = await searchParams;
  const hojeISO = dataParaISO(new Date());
  const dataISO = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : hojeISO;
  const historico = await listarHistoricoComandas(dataISO);
  if (!historico) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Comandas</h1>
        <ComandasNav />
      </div>

      <NavegacaoDia basePath="/gerenciamento/comandas/historico" dataISO={dataISO} hojeISO={hojeISO} />

      <section aria-label="Resumo do dia" className="grid gap-2 sm:grid-cols-[1fr_2fr]">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-sm text-muted-foreground">Total recebido</p>
          <p className="text-2xl font-semibold tabular-nums">{formatarPreco(historico.totalCentavos)}</p>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {historico.porMetodo.length === 0 ? (
            <li className="col-span-full flex items-center rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Nada recebido nesse dia.
            </li>
          ) : (
            historico.porMetodo.map((m) => (
              <li key={m.metodo} className="rounded-xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">{rotuloMetodo(m.metodo)}</p>
                <p className="font-semibold tabular-nums">{formatarPreco(m.totalCentavos)}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <HistoricoComandasLista key={dataISO} comandas={historico.comandas} />
    </div>
  );
}
