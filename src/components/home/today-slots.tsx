import { formatInTimeZone } from "date-fns-tz";
import { TodaySlotsClient } from "@/components/home/today-slots-client";
import { listarModalidadesComResumo } from "@/features/modalidades/actions/listar-modalidades-resumo";
import { listarHorariosDisponiveisPorModalidade } from "@/features/reservas/actions/listar-horarios-disponiveis-modalidade";
import { TIME_ZONE } from "@/lib/constants";

export async function TodaySlots() {
  const modalidades = await listarModalidadesComResumo();
  if (modalidades.length === 0) return null;

  const hojeISO = formatInTimeZone(new Date(), TIME_ZONE, "yyyy-MM-dd");
  const primeiraModalidade = modalidades[0];
  const slotsIniciais = await listarHorariosDisponiveisPorModalidade(
    primeiraModalidade.id,
    hojeISO
  );

  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <TodaySlotsClient
          modalidades={modalidades.map((m) => ({ id: m.id, nome: m.nome }))}
          modalidadeInicialId={primeiraModalidade.id}
          slotsIniciais={slotsIniciais}
          hojeISO={hojeISO}
        />
      </div>
    </section>
  );
}
