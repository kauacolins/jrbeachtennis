export const TIME_ZONE = "America/Sao_Paulo";

// Regra 5 e regra 4 do docs/REQUISITOS.md.
export const JANELA_MAXIMA_DIAS = 30;
// Reserva em passos de meia hora: 1h, 1h30, 2h, 2h30, 3h. Início também em
// :00 ou :30, pra uma reserva de 1h30 não deixar meia hora morta depois dela.
export const PASSO_RESERVA_MIN = 30;
export const DURACAO_MINIMA_MIN = 60;
export const DURACAO_MAXIMA_MIN = 180;

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

// Pix manual do torneio (docs/TORNEIOS.md, "pagamento confirmado à mão pelo
// admin"): instruções mostradas pro cliente na inscrição e em Minhas
// inscrições até o admin confirmar o pagamento. Sem as duas variáveis, cai
// num texto genérico (ver PixInstrucoes).
export const PIX_CHAVE_ARENA = process.env.PIX_CHAVE_ARENA || "";
export const PIX_TITULAR_ARENA = process.env.PIX_TITULAR_ARENA || "";

// Endereço público do site, pros links que vão em mensagem de WhatsApp
// (ex.: "reserve pelo site"). Vazio = a mensagem sai sem link.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || "";
