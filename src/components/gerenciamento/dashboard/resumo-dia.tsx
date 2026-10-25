import { CalendarCheck, Percent, Receipt, Wallet, type LucideIcon } from "lucide-react";
import { formatarPreco } from "@/lib/format";

interface Estatistica {
  chave: string;
  label: string;
  valor: string;
  icone: LucideIcon;
}

// Dashboard, linha de KPIs acima dos widgets (admin-panel-ui): o pulso do
// dia em números — faturamento, volume de reservas e comandas, ocupação
// das quadras — pra decidir sem precisar abrir cada tela. No celular vira
// uma grade 2x2 mais compacta.
export function ResumoDia({
  faturadoHojeCentavos,
  reservasHoje,
  ocupacaoPercentual,
  comandasAbertas,
}: {
  faturadoHojeCentavos: number;
  reservasHoje: number;
  ocupacaoPercentual: number | null;
  comandasAbertas: number;
}) {
  const estatisticas: Estatistica[] = [
    {
      chave: "faturamento",
      label: "Faturamento hoje",
      valor: formatarPreco(faturadoHojeCentavos),
      icone: Wallet,
    },
    {
      chave: "reservas",
      label: "Reservas hoje",
      valor: String(reservasHoje),
      icone: CalendarCheck,
    },
    {
      chave: "ocupacao",
      label: "Ocupação das quadras",
      valor: ocupacaoPercentual === null ? "—" : `${ocupacaoPercentual}%`,
      icone: Percent,
    },
    {
      chave: "comandas",
      label: "Comandas abertas",
      valor: String(comandasAbertas),
      icone: Receipt,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
      {estatisticas.map((item) => {
        const Icone = item.icone;
        return (
          <div key={item.chave} className="flex items-center gap-2 rounded-xl border bg-card p-3 md:gap-3 md:p-4">
            <span className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary sm:flex">
              <Icone className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{item.label}</p>
              <p className="font-heading text-lg font-semibold tabular-nums md:text-xl">{item.valor}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
