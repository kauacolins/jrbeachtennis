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

/** Minutos desde 00:00 -> "HH:mm". Usado na agenda do admin (obterAgendaDia). */
export function minutosParaHora(min: number): string {
  const horas = String(Math.floor(min / 60)).padStart(2, "0");
  const minutos = String(min % 60).padStart(2, "0");
  return `${horas}:${minutos}`;
}

/**
 * Formata telefone BR progressivamente: "11987654321" -> "(11) 98765-4321".
 * Degrada bem com qualquer quantidade de dígitos, então serve tanto pra
 * exibir um telefone já salvo quanto de máscara enquanto a pessoa digita.
 */
export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

/**
 * Formata CPF progressivamente: "12345678901" -> "123.456.789-01". Mesma
 * ideia de formatarTelefone — serve tanto pra exibir quanto de máscara
 * durante a digitação. Só máscara, não valida dígito verificador (quem
 * valida de verdade é o Mercado Pago na hora de gerar o Pix).
 */
export function formatarCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length === 0) return "";
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  }
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}
