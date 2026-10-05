import { NextResponse, type NextRequest } from "next/server";
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { paymentMercadoPago } from "@/lib/mercadopago";

// Mecanismo "de verdade" de confirmação de pagamento em produção — em
// paralelo com consultarReserva, que cobre o polling do navegador e
// também serve de rede de segurança quando essa URL não é alcançável
// (desenvolvimento local sem túnel público). Nunca confia no corpo da
// notificação: só usa pra saber QUAL pagamento consultar, e busca o
// estado de verdade direto na API do Mercado Pago antes de confirmar
// qualquer coisa.
export async function POST(request: NextRequest) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ erro: "Webhook não configurado." }, { status: 500 });
  }

  const dataId = request.nextUrl.searchParams.get("data.id");
  const tipo = request.nextUrl.searchParams.get("type");

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret,
      toleranceSeconds: 300,
    });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      console.warn("[mercadopago] webhook com assinatura inválida", error.reason);
      return NextResponse.json({ erro: "Assinatura inválida." }, { status: 401 });
    }
    throw error;
  }

  // Notificação de outro recurso (merchant_order etc.) — só pagamento nos
  // interessa, confirma recebimento e ignora.
  if (tipo !== "payment" || !dataId) {
    return NextResponse.json({ ok: true });
  }

  const pagamento = await paymentMercadoPago().get({ id: dataId });

  const reserva = await prisma.reserva.findUnique({
    where: { pagamentoId: String(pagamento.id) },
  });
  if (!reserva) {
    // Pagamento de outro fluxo, ou chegou antes do pagamentoId ser salvo
    // (ver criarPagamentoPix) — nada a fazer, consultarReserva reconcilia.
    return NextResponse.json({ ok: true });
  }

  if (pagamento.status === "approved" && reserva.status === "PENDENTE_PAGAMENTO") {
    await prisma.reserva.update({
      where: { id: reserva.id },
      data: { status: "CONFIRMADA", pago: true },
    });
  } else if (
    (pagamento.status === "rejected" || pagamento.status === "cancelled") &&
    reserva.status === "PENDENTE_PAGAMENTO"
  ) {
    await prisma.reserva.update({
      where: { id: reserva.id },
      data: { status: "CANCELADA", canceladaEm: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
