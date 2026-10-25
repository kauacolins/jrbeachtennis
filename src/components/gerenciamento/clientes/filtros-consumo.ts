import type { TipoConsumo } from "@/features/usuarios/actions/obter-cliente";

// Abas do consumo no detalhe do cliente (?tipo= na URL). Fora do
// componente client pra page.tsx validar o searchParam no servidor.
export type FiltroConsumo = "todos" | "reservas" | "day_use" | "bar" | "torneios";

export const FILTROS_CONSUMO: { valor: FiltroConsumo; label: string; tipos: TipoConsumo[] | null }[] = [
  { valor: "todos", label: "Tudo", tipos: null },
  { valor: "reservas", label: "Reservas", tipos: ["RESERVA"] },
  { valor: "day_use", label: "Day use e mensal", tipos: ["DAY_USE", "MENSAL"] },
  { valor: "bar", label: "Bar", tipos: ["BAR"] },
  { valor: "torneios", label: "Torneios", tipos: ["TORNEIO"] },
];

export function ehFiltroConsumo(valor: unknown): valor is FiltroConsumo {
  return FILTROS_CONSUMO.some((f) => f.valor === valor);
}
