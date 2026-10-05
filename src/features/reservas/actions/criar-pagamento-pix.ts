"use server";

import { prisma } from "@/lib/prisma";
import { pagamentoPixHabilitado, paymentMercadoPago } from "@/lib/mercadopago";
import { criarPagamentoPixSchema, type CriarPagamentoPixInput } from "../schema";

export type CriarPagamentoPixResultado =
  | {
      ok: true;
      // true quando o MP já aprovou na hora (ex.: modo de teste com
      // payer.first_name "APRO") — a reserva já nasceu CONFIRMADA e nem
      // precisa mostrar o QR code.
      aprovado: boolean;
      qrCode: string;
      qrCodeBase64: string;
      expiraEm: string;
    }
  | { ok: false; erro: string };

// E-mail nunca foi coletado do cliente (só nome/telefone, ver
// criarReservaSchema) — o Mercado Pago exige um pra gerar o Pix, então
// sintetiza um a partir do telefone em vez de pedir ao cliente. Cliente
// logado usa o e-mail real da conta.
//
// Em ambiente de teste, o Mercado Pago rejeita e-mail "inventado" com
// "Unauthorized use of live credentials" — ele precisa ser o de um
// usuário de teste comprador criado no painel deles (Suas integrações >
// Contas de teste). MERCADOPAGO_TEST_PAYER_EMAIL sobrescreve o e-mail
// sintetizado só nesse cenário; em produção fica vazio e não tem efeito.
function emailPagador(reserva: {
  telefoneContato: string | null;
  user: { email: string } | null;
}) {
  if (process.env.MERCADOPAGO_TEST_PAYER_EMAIL) {
    return process.env.MERCADOPAGO_TEST_PAYER_EMAIL;
  }
  if (reserva.user?.email) return reserva.user.email;
  const digitos = (reserva.telefoneContato ?? "").replace(/\D/g, "") || "cliente";
  return `${digitos}@clientes.arenajr.com.br`;
}

function urlNotificacao() {
  const base = process.env.BETTER_AUTH_URL;
  if (!base || base.includes("localhost")) return undefined;
  return `${base}/api/webhooks/mercadopago`;
}

// RF07 com pagamento online: gera a cobrança Pix pra uma reserva que já
// nasceu PENDENTE_PAGAMENTO (ver criarReserva) segurando o horário. O CPF
// só passa por aqui — nunca é salvo na Reserva (ver schema.ts).
export async function criarPagamentoPix(
  input: CriarPagamentoPixInput
): Promise<CriarPagamentoPixResultado> {
  if (!pagamentoPixHabilitado) {
    return { ok: false, erro: "Pagamento via Pix não está disponível no momento." };
  }

  const parsed = criarPagamentoPixSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { reservaId, cpf } = parsed.data;

  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { user: { select: { email: true } } },
  });
  if (!reserva) {
    return { ok: false, erro: "Reserva não encontrada." };
  }
  if (reserva.status !== "PENDENTE_PAGAMENTO") {
    return {
      ok: false,
      erro: reserva.pago
        ? "Essa reserva já está paga."
        : "Essa reserva não está mais aguardando pagamento.",
    };
  }
  if (!reserva.expiraEm || reserva.expiraEm.getTime() <= Date.now()) {
    return {
      ok: false,
      erro: "O prazo pra pagar essa reserva expirou. Faça a reserva de novo.",
    };
  }

  const nomes = (reserva.nomeContato ?? "Cliente Arena JR").trim().split(/\s+/);
  const primeiroNome = nomes[0];
  const sobrenome = nomes.slice(1).join(" ") || primeiroNome;

  try {
    const resultado = await paymentMercadoPago().create({
      body: {
        transaction_amount: reserva.valorCentavos / 100,
        description: "Reserva de quadra - Arena JR",
        payment_method_id: "pix",
        external_reference: reserva.id,
        notification_url: urlNotificacao(),
        payer: {
          email: emailPagador(reserva),
          first_name: primeiroNome,
          last_name: sobrenome,
          identification: { type: "CPF", number: cpf },
        },
      },
      requestOptions: { idempotencyKey: reserva.id },
    });

    const dadosPix = resultado.point_of_interaction?.transaction_data;
    if (!resultado.id || !dadosPix?.qr_code || !dadosPix.qr_code_base64) {
      return { ok: false, erro: "Não foi possível gerar o Pix. Tente novamente." };
    }

    const aprovado = resultado.status === "approved";

    await prisma.reserva.update({
      where: { id: reserva.id },
      data: {
        pagamentoId: String(resultado.id),
        ...(aprovado ? { status: "CONFIRMADA", pago: true } : {}),
      },
    });

    return {
      ok: true,
      aprovado,
      qrCode: dadosPix.qr_code,
      qrCodeBase64: dadosPix.qr_code_base64,
      expiraEm: reserva.expiraEm.toISOString(),
    };
  } catch (error) {
    // O SDK trunca "causes" no log padrão (Node não expande array
    // aninhado), e alguns agregadores de log (ex.: Vercel) só mostram o
    // primeiro argumento de um console.error com vários — então tudo
    // precisa ir concatenado numa única string pra não perder o motivo
    // específico do 401 que o Mercado Pago manda em "causes".
    const causas =
      error && typeof error === "object" && "causes" in error
        ? (error as { causes: unknown }).causes
        : undefined;
    const mensagem = error instanceof Error ? error.message : String(error);
    console.error(
      `[mercadopago] erro ao criar pagamento pix: ${mensagem} | causes: ${JSON.stringify(causas)}`
    );
    return { ok: false, erro: "Não foi possível gerar o Pix. Tente novamente." };
  }
}
