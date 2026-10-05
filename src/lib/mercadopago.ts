import { MercadoPagoConfig, Payment } from "mercadopago";

// Sem as credenciais (dev sem .env preenchido), o pagamento via Pix fica
// desativado — mesma ideia do googleAuthHabilitado em lib/auth.ts.
export const pagamentoPixHabilitado = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);

const client = pagamentoPixHabilitado
  ? new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN as string })
  : null;

export function clientMercadoPago() {
  if (!client) {
    throw new Error("Mercado Pago não configurado (MERCADOPAGO_ACCESS_TOKEN ausente).");
  }
  return client;
}

export function paymentMercadoPago() {
  return new Payment(clientMercadoPago());
}
