import { listarComandasAbertas } from "@/features/comandas/actions/listar-comandas";
import { dataParaISO } from "@/lib/format";
import { ComandasNav } from "@/components/gerenciamento/comandas/comandas-nav";
import { ComandasPainel } from "@/components/gerenciamento/comandas/comandas-painel";

// RF31/RF32: painel de comandas abertas (docs/COMANDAS.md).
export default async function ComandasPage() {
  const comandas = await listarComandasAbertas();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Comandas</h1>
        <ComandasNav />
      </div>
      <ComandasPainel comandas={comandas} hojeISO={dataParaISO(new Date())} />
    </div>
  );
}
