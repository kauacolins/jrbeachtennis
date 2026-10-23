import { obterAgendaDia } from "@/features/gerenciamento/actions/obter-agenda-dia";
import { listarQuadrasAdmin } from "@/features/quadras/actions/listar-quadras-admin";
import { dataParaISO } from "@/lib/format";
import { PIX_CHAVE_ARENA, PIX_TITULAR_ARENA } from "@/lib/constants";
import { AgendaDoDia } from "@/components/gerenciamento/agenda-do-dia";
import { NavegacaoDia } from "@/components/gerenciamento/balcao/navegacao-dia";

// RF13: agenda geral do dia, com todas as quadras.
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data } = await searchParams;
  const hojeISO = dataParaISO(new Date());
  const dataISO = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : hojeISO;

  const [agenda, quadrasAdmin] = await Promise.all([
    obterAgendaDia(dataISO),
    listarQuadrasAdmin(),
  ]);

  return (
    <div>
      <AgendaDoDia
        key={dataISO}
        agenda={agenda}
        hojeISO={hojeISO}
        quadrasAdmin={quadrasAdmin}
        pix={
          PIX_CHAVE_ARENA && PIX_TITULAR_ARENA
            ? { chave: PIX_CHAVE_ARENA, titular: PIX_TITULAR_ARENA }
            : null
        }
        navegacao={
          <NavegacaoDia
            basePath="/gerenciamento/agenda"
            dataISO={dataISO}
            hojeISO={hojeISO}
            className="order-3 md:order-2"
          />
        }
      />
    </div>
  );
}
