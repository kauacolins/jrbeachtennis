import Link from "next/link";
import { listarPassesDoDia } from "@/features/day-use/actions/listar-passes-dia";
import { dataParaISO } from "@/lib/format";
import { NavegacaoDia } from "@/components/gerenciamento/balcao/navegacao-dia";
import { DayUseLista } from "@/components/gerenciamento/balcao/day-use-lista";

// RF18: lista de day use do dia. O lançamento é pela comanda (RF36); aqui o
// operador confere quem entrou, quem já pagou e quantas vagas sobram.
export default async function DayUsePage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data } = await searchParams;
  const hojeISO = dataParaISO(new Date());
  const dataISO = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : hojeISO;
  const dia = await listarPassesDoDia(dataISO);
  if (!dia) return null;

  const vagas = dia.limiteDiario !== null ? dia.limiteDiario - dia.totalAtivos : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Day use</h1>
        <NavegacaoDia basePath="/gerenciamento/day-use" dataISO={dataISO} hojeISO={hojeISO} />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">
          {dia.totalAtivos} {dia.totalAtivos === 1 ? "pessoa" : "pessoas"}
          {dia.limiteDiario !== null && ` de ${dia.limiteDiario}`}
          {vagas !== null && (
            <span className="text-muted-foreground">
              {" "}
              · {vagas > 0 ? `${vagas} ${vagas === 1 ? "vaga" : "vagas"}` : "lotado"}
            </span>
          )}
        </span>
        <span className="text-muted-foreground">
          Para lançar, abra a{" "}
          <Link href="/gerenciamento/comandas" className="font-medium text-primary underline-offset-4 hover:underline">
            comanda
          </Link>{" "}
          da pessoa e toque em Day use.
        </span>
      </div>

      <DayUseLista key={dataISO} passes={dia.passes} />
    </div>
  );
}
