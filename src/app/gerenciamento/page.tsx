import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { exigirAdmin } from "@/lib/require-admin";
import { dataParaISO } from "@/lib/format";
import { TIME_ZONE } from "@/lib/constants";
import { obterAgendaDia } from "@/features/gerenciamento/actions/obter-agenda-dia";
import { listarComandasAbertas, listarHistoricoComandas } from "@/features/comandas/actions/listar-comandas";
import { listarPlanos } from "@/features/planos/actions/planos";
import { listarInscricoesPendentes } from "@/features/torneios/actions/listar-inscritos";
import { WidgetReservas } from "@/components/gerenciamento/dashboard/widget-reservas";
import { WidgetVendasRapidas } from "@/components/gerenciamento/dashboard/widget-vendas-rapidas";
import { WidgetPendencias } from "@/components/gerenciamento/dashboard/widget-pendencias";
import { WidgetAvisos } from "@/components/gerenciamento/dashboard/widget-avisos";
import { ResumoDia } from "@/components/gerenciamento/dashboard/resumo-dia";

function saudacao(agora: Date) {
  const hora = Number(formatInTimeZone(agora, TIME_ZONE, "H"));
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

// Dashboard do gerenciamento (admin-panel-ui): grade de widgets com o que o
// operador precisa decidir agora, em vez de uma lista de atalhos — os
// atalhos de navegação já moraram pra sidebar (ver GerenciamentoSidebar).
export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  // A agenda morava aqui; link antigo com ?data= continua funcionando.
  const { data } = await searchParams;
  if (data) redirect(`/gerenciamento/agenda?data=${encodeURIComponent(data)}`);

  const usuario = await exigirAdmin();
  if (!usuario) return null;

  const agora = new Date();
  const hojeISO = dataParaISO(agora);

  const [agenda, comandasAbertas, historicoHoje, mensaisVencendo, inscricoesPendentes] = await Promise.all([
    obterAgendaDia(hojeISO),
    listarComandasAbertas(),
    listarHistoricoComandas(hojeISO),
    listarPlanos("vencendo"),
    listarInscricoesPendentes(),
  ]);

  const reservasNaoPagas = agenda.quadras.reduce(
    (soma, q) =>
      soma + q.blocos.filter((b) => b.tipo === "reserva" && b.status !== "CANCELADA" && !b.pago).length,
    0
  );
  const comandasAbertasDeOutroDia = comandasAbertas.filter(
    (c) => dataParaISO(c.abertaEm) !== hojeISO
  ).length;
  const vendasHoje = historicoHoje?.comandas.filter((c) => c.status === "FECHADA").length ?? 0;

  const reservasHoje = agenda.quadras.reduce(
    (soma, q) => soma + q.blocos.filter((b) => b.tipo === "reserva" && b.status !== "CANCELADA").length,
    0
  );

  // Ocupação do dia: minutos reservados / minutos de grade abertos, só nas
  // quadras com horário cadastrado pra esse dia da semana.
  const quadrasAbertas = agenda.quadras.filter(
    (q): q is typeof q & { abreMin: number; fechaMin: number } => q.abreMin !== null && q.fechaMin !== null
  );
  const minutosDisponiveis = quadrasAbertas.reduce((soma, q) => soma + (q.fechaMin - q.abreMin), 0);
  const minutosReservados = quadrasAbertas.reduce(
    (soma, q) =>
      soma +
      q.blocos
        .filter((b) => b.tipo === "reserva" && b.status !== "CANCELADA")
        .reduce((s, b) => s + (b.fimMin - b.inicioMin), 0),
    0
  );
  const ocupacaoPercentual = minutosDisponiveis > 0 ? Math.round((minutosReservados / minutosDisponiveis) * 100) : null;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold">
        {saudacao(agora)}, {usuario.name.split(" ")[0]}!
      </h2>

      <ResumoDia
        faturadoHojeCentavos={historicoHoje?.totalCentavos ?? 0}
        reservasHoje={reservasHoje}
        ocupacaoPercentual={ocupacaoPercentual}
        comandasAbertas={comandasAbertas.length}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <WidgetReservas agendaInicial={agenda} />
        <WidgetVendasRapidas
          className="order-first md:order-none"
          comandasAbertas={comandasAbertas}
          faturadoHojeCentavos={historicoHoje?.totalCentavos ?? 0}
          vendasHoje={vendasHoje}
        />
        <WidgetPendencias
          mensaisVencendo={mensaisVencendo.length}
          reservasNaoPagas={reservasNaoPagas}
          comandasAbertasDeOntem={comandasAbertasDeOutroDia}
          inscricoesPendentes={inscricoesPendentes.length}
        />
        <WidgetAvisos />
      </div>
    </div>
  );
}
