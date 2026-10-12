import { notFound } from "next/navigation";
import { obterComanda } from "@/features/comandas/actions/listar-comandas";
import { listarProdutosParaLancar } from "@/features/produtos/actions/listar-produtos";
import { dataParaISO } from "@/lib/format";
import { ComandaDetalhe } from "@/components/gerenciamento/comandas/comanda-detalhe";

// RF33–RF38: lançar itens, day use e reserva; receber e fechar.
export default async function ComandaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [comanda, produtos] = await Promise.all([obterComanda(id), listarProdutosParaLancar()]);
  if (!comanda) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <ComandaDetalhe comanda={comanda} produtos={produtos} hojeISO={dataParaISO(new Date())} />
    </div>
  );
}
