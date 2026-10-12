export const TIME_ZONE = "America/Sao_Paulo";

// Regra 5 e regra 4 do docs/REQUISITOS.md.
export const JANELA_MAXIMA_DIAS = 30;
export const DURACAO_MINIMA_HORAS = 1;
export const DURACAO_MAXIMA_HORAS = 3;

// Prazo pro cliente pagar o Pix antes da reserva perder o horário (ver
// criarReserva/expirarReservasPendentes).
export const PRAZO_PAGAMENTO_PIX_MIN = 15;

// Por enquanto o pagamento da reserva é só no local: mesmo com o Mercado Pago
// configurado, a reserva nasce CONFIRMADA sem Pix. Volta pra true quando o
// Pix no fluxo de reserva for liberado (ver criarReserva).
export const PIX_NA_RESERVA_ATIVO = false;

// Regra 6 do docs/REQUISITOS.md: reservas em aberto (pendentes ou confirmadas
// que ainda não terminaram) por cliente.
export const LIMITE_RESERVAS_ABERTAS = 2;
