import { listarPassesDoDia } from "@/features/day-use/actions/listar-passes-dia";
import { dataParaISO } from "@/lib/format";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { NavegacaoDia } from "@/components/gerenciamento/balcao/navegacao-dia";
import { DayUseLista } from "@/components/gerenciamento/balcao/day-use-lista";
import { ComandaDayUseBotao } from "@/components/gerenciamento/balcao/comanda-day-use-botao";

// RF18: lista de day use do dia. O lançamento é pela comanda (RF36); aqui o
// operador confere quem entrou, quem já pagou e quantas vagas sobram, e
// pode abrir uma comanda já com o day use de hoje (ComandaDayUseBotao).
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

      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Abre a comanda no nome do cliente já com o day use de hoje. Se ele já tem comanda aberta, o
          day use entra nela.
        </p>
        <ComandaDayUseBotao variant="default" className="w-full shrink-0 sm:w-auto" />
      </div>

      <DayUseLista key={dataISO} passes={dia.passes} />
    </div>
  );
}
