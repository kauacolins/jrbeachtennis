import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { TIME_ZONE } from "@/lib/constants";

export function formatarPreco(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

export function formatarHora(data: Date | string): string {
  return formatInTimeZone(data, TIME_ZONE, "HH:mm");
}

export function formatarDataLonga(data: Date | string): string {
  return formatInTimeZone(data, TIME_ZONE, "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });
}

export function formatarDataCurta(data: Date | string): string {
  return formatInTimeZone(data, TIME_ZONE, "dd/MM");
}

/** "yyyy-MM-dd" em America/Sao_Paulo — formato usado nos parâmetros de URL. */
export function dataParaISO(data: Date | string): string {
  return formatInTimeZone(data, TIME_ZONE, "yyyy-MM-dd");
}
