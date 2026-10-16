import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obterAgendaDia } from "@/features/gerenciamento/actions/obter-agenda-dia";
import { listarQuadrasAdmin } from "@/features/quadras/actions/listar-quadras-admin";
import { adicionarDias } from "@/lib/datas";
import { dataParaISO } from "@/lib/format";
import { AgendaDoDia } from "@/components/gerenciamento/agenda-do-dia";
import { SeletorDataAdmin } from "@/components/gerenciamento/seletor-data-admin";

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

  const anteriorISO = adicionarDias(dataISO, -1);
  const proximaISO = adicionarDias(dataISO, 1);

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Agenda do dia</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            render={<Link href={`/gerenciamento/agenda?data=${anteriorISO}`} aria-label="Dia anterior" />}
            nativeButton={false}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <SeletorDataAdmin dataISO={dataISO} />
          {dataISO !== hojeISO && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/gerenciamento/agenda" />}
              nativeButton={false}
            >
              Hoje
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            render={<Link href={`/gerenciamento/agenda?data=${proximaISO}`} aria-label="Próximo dia" />}
            nativeButton={false}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>

      <AgendaDoDia
        key={dataISO}
        agenda={agenda}
        hojeISO={hojeISO}
        quadrasAdmin={quadrasAdmin}
      />
    </div>
  );
}
