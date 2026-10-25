import { notFound } from "next/navigation";
import { obterCliente } from "@/features/usuarios/actions/obter-cliente";
import { ClienteDetalhe } from "@/components/gerenciamento/clientes/cliente-detalhe";
import { ehFiltroConsumo } from "@/components/gerenciamento/clientes/filtros-consumo";
import { PIX_CHAVE_ARENA, PIX_TITULAR_ARENA, SITE_URL } from "@/lib/constants";

// Detalhe do cliente aberto pelo card em /gerenciamento/clientes: consumo
// e mensagens prontas pro WhatsApp.
export default async function ClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const [{ id }, { tipo }] = await Promise.all([params, searchParams]);
  const detalhe = await obterCliente(id);
  if (!detalhe) notFound();

  return (
    <ClienteDetalhe
      detalhe={detalhe}
      filtroInicial={ehFiltroConsumo(tipo) ? tipo : "todos"}
      siteUrl={SITE_URL}
      pix={PIX_CHAVE_ARENA && PIX_TITULAR_ARENA ? { chave: PIX_CHAVE_ARENA, titular: PIX_TITULAR_ARENA } : null}
    />
  );
}
