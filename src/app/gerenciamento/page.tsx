import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, Sun } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { exigirAdmin } from "@/lib/require-admin";
import { Button } from "@/components/ui/button";
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
//
// No celular (operador no balcão) a ordem muda pro que é mais usado de pé:
// atalhos grandes de reserva e day use (o header só tem espaço pra Venda
// rápida), KPIs em 2x2, Vendas rápidas, Pendências, Reservas e Avisos. A
// partir de md: volta a grade com Reservas primeiro.
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
    <div className="flex flex-col gap-4 md:gap-6">
      <h2 className="font-heading text-lg font-semibold md:text-xl">
        {saudacao(agora)}, {usuario.name.split(" ")[0]}!
      </h2>

      <div className="grid grid-cols-2 gap-2 sm:hidden">
        <Button
          variant="outline"
          className="h-14 flex-col gap-1 bg-card text-sm font-semibold [&_svg]:size-5!"
          nativeButton={false}
          render={<Link href="/gerenciamento/agenda" />}
        >
          <CalendarPlus aria-hidden />
          Nova reserva
        </Button>
        <Button
          variant="outline"
          className="h-14 flex-col gap-1 bg-card text-sm font-semibold [&_svg]:size-5!"
          nativeButton={false}
          render={<Link href="/gerenciamento/day-use" />}
        >
          <Sun aria-hidden />
          Day use
        </Button>
      </div>

      <ResumoDia
        faturadoHojeCentavos={historicoHoje?.totalCentavos ?? 0}
        reservasHoje={reservasHoje}
        ocupacaoPercentual={ocupacaoPercentual}
        comandasAbertas={comandasAbertas.length}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <WidgetVendasRapidas
          className="md:order-2"
          comandasAbertas={comandasAbertas}
          faturadoHojeCentavos={historicoHoje?.totalCentavos ?? 0}
          vendasHoje={vendasHoje}
        />
        <WidgetPendencias
          className="md:order-3"
          mensaisVencendo={mensaisVencendo.length}
          reservasNaoPagas={reservasNaoPagas}
          comandasAbertasDeOntem={comandasAbertasDeOutroDia}
          inscricoesPendentes={inscricoesPendentes.length}
        />
        <WidgetReservas agendaInicial={agenda} className="md:order-1" />
        <WidgetAvisos className="md:order-4" />
      </div>
    </div>
  );
}
