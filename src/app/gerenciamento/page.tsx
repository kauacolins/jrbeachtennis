import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  History,
  LandPlot,
  Package,
  Receipt,
  ShoppingBag,
  Ticket,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { exigirAdmin } from "@/lib/require-admin";
import { dataParaISO, formatarPreco } from "@/lib/format";
import { cn } from "@/lib/utils";
import { obterResumoInicio } from "@/features/gerenciamento/actions/obter-resumo-inicio";

interface Atalho {
  href: string;
  titulo: string;
  detalhe?: string;
  icone: LucideIcon;
}

// Tela inicial do gerenciamento: atalhos pras tarefas do balcão, com os
// números do dia, e embaixo a configuração (menos usada).
export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  // A agenda morava aqui; link antigo com ?data= continua funcionando.
  const { data } = await searchParams;
  if (data) redirect(`/gerenciamento/agenda?data=${encodeURIComponent(data)}`);

  const usuario = await exigirAdmin();
  const resumo = await obterResumoInicio(dataParaISO(new Date()));
  if (!usuario || !resumo) return null;
  const ehAdmin = usuario.role === "ADMIN";

  const vagasDayUse =
    resumo.dayUseLimite !== null ? Math.max(0, resumo.dayUseLimite - resumo.dayUseHoje) : null;

  const operacao: Atalho[] = [
    {
      href: "/gerenciamento/comandas",
      titulo: "Comandas abertas",
      detalhe:
        resumo.comandasAbertas === 0
          ? "Nenhuma aberta"
          : `${resumo.comandasAbertas} · ${formatarPreco(resumo.totalAbertoCentavos)} em aberto`,
      icone: Receipt,
    },
    {
      href: "/gerenciamento/agenda",
      titulo: "Agenda de hoje",
      detalhe:
        resumo.reservasHoje === 0
          ? "Nenhuma reserva"
          : `${resumo.reservasHoje} ${resumo.reservasHoje === 1 ? "reserva" : "reservas"}` +
            (resumo.reservasAPagar > 0 ? ` · ${resumo.reservasAPagar} a pagar` : ""),
      icone: CalendarDays,
    },
    {
      href: "/gerenciamento/day-use",
      titulo: "Day use",
      detalhe:
        `${resumo.dayUseHoje} ${resumo.dayUseHoje === 1 ? "pessoa" : "pessoas"} hoje` +
        (vagasDayUse !== null ? ` · ${vagasDayUse > 0 ? `${vagasDayUse} vagas` : "lotado"}` : ""),
      icone: Ticket,
    },
    { href: "/gerenciamento/planos", titulo: "Planos mensais", icone: UserRound },
    { href: "/gerenciamento/comandas/historico", titulo: "Caixa do dia", detalhe: "Histórico de comandas", icone: History },
  ];

  const configuracao: Atalho[] = [
    { href: "/gerenciamento/quadras", titulo: "Quadras", icone: LandPlot },
    ...(ehAdmin ? [{ href: "/gerenciamento/produtos", titulo: "Produtos e preços", icone: Package }] : []),
    { href: "/gerenciamento/equipe", titulo: "Equipe", icone: Users },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
      <h1 className="font-heading text-xl font-bold">Início</h1>

      <Link
        href="/gerenciamento/comandas/pedido"
        className="flex min-h-20 items-center gap-4 rounded-xl bg-primary p-4 text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
          <ShoppingBag className="size-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold">Novo pedido</span>
          <span className="block text-sm opacity-90">Escolha os produtos e lance na comanda</span>
        </span>
        <ChevronRight className="size-5 shrink-0" aria-hidden />
      </Link>

      <section aria-labelledby="operacao-titulo" className="flex flex-col gap-2">
        <h2 id="operacao-titulo" className="text-sm font-medium text-muted-foreground">
          Balcão
        </h2>
        <ListaAtalhos atalhos={operacao} />
      </section>

      <section aria-labelledby="config-titulo" className="flex flex-col gap-2">
        <h2 id="config-titulo" className="text-sm font-medium text-muted-foreground">
          Configuração
        </h2>
        <ListaAtalhos atalhos={configuracao} compacto />
      </section>
    </div>
  );
}

function ListaAtalhos({ atalhos, compacto = false }: { atalhos: Atalho[]; compacto?: boolean }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {atalhos.map(({ href, titulo, detalhe, icone: Icone }) => (
        <li key={href}>
          <Link
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-background p-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              compacto ? "min-h-14" : "min-h-16"
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
              <Icone className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{titulo}</span>
              {detalhe && (
                <span className="block truncate text-sm text-muted-foreground tabular-nums">{detalhe}</span>
              )}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
