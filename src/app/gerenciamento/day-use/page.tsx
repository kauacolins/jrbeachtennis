import Link from "next/link";
import { listarPassesDoDia } from "@/features/day-use/actions/listar-passes-dia";
import { dataParaISO } from "@/lib/format";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
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

  const contagemPessoas = `${dia.totalAtivos} ${dia.totalAtivos === 1 ? "pessoa" : "pessoas"}${
    dia.limiteDiario !== null ? ` de ${dia.limiteDiario}` : ""
  }${
    vagas !== null ? ` · ${vagas > 0 ? `${vagas} ${vagas === 1 ? "vaga" : "vagas"}` : "lotado"}` : ""
  }`;

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoLista
        titulo="Day use"
        contagem={contagemPessoas}
        acao={<NavegacaoDia basePath="/gerenciamento/day-use" dataISO={dataISO} hojeISO={hojeISO} />}
      />

      <p className="text-sm text-muted-foreground">
        Para lançar, abra a{" "}
        <Link href="/gerenciamento/comandas" className="font-medium text-primary underline-offset-4 hover:underline">
          comanda
        </Link>{" "}
        da pessoa e toque em Day use.
      </p>

      <DayUseLista key={dataISO} passes={dia.passes} />
    </div>
  );
}
