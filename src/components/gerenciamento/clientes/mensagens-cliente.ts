import { Banknote, CalendarCheck, CalendarPlus, Hand, MessageCircle, RefreshCw, type LucideIcon } from "lucide-react";
import { formatarDataLonga, formatarHora, formatarPreco } from "@/lib/format";
import type { PixArena } from "@/components/gerenciamento/reserva-detalhe-painel";

export interface ModeloMensagem {
  id: string;
  label: string;
  descricao: string;
  icone: LucideIcon;
  texto: string;
}

/** O que a página de detalhe sabe a mais que o card (consumo em aberto, próxima reserva, mensal). */
export interface ContextoMensagem {
  emAberto?: { titulo: string; valorCentavos: number }[];
  proximaReserva?: { inicio: Date; fim: Date; quadra: string; modalidade: string } | null;
  mensalAtivoAte?: Date | null;
  pix?: PixArena | null;
}

const DIAS_AVISO_MENSAL = 7;

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? "";
}

/**
 * Convite pra renovar o mensal — muda a frase conforme o plano ainda vale
 * ou já venceu. Usado no card de Planos e no detalhe do cliente.
 */
export function mensagemRenovacaoPlano({
  nome,
  fim,
  vencido,
  precoCentavos,
  pix,
}: {
  nome: string;
  fim: Date;
  vencido: boolean;
  precoCentavos?: number | null;
  pix?: PixArena | null;
}) {
  const data = formatarDataLonga(fim);
  return [
    `Olá, ${primeiroNome(nome)}! Aqui é da Arena JR.`,
    vencido
      ? `Seu plano mensal venceu ${data}. Bora renovar pra continuar com o day use liberado?`
      : `Seu plano mensal vence ${data}. Quer renovar? Os 30 dias novos começam quando o atual acabar, sem perder nenhum dia.`,
    precoCentavos ? `Valor: ${formatarPreco(precoCentavos)}` : null,
    pix ? "" : null,
    pix ? `Pix: ${pix.chave}` : null,
    pix ? `Titular: ${pix.titular}` : null,
    "",
    pix
      ? "Assim que pagar, é só mandar o comprovante por aqui."
      : "É só responder aqui ou passar no balcão.",
  ]
    .filter((linha) => linha !== null)
    .join("\n");
}

// Modelos prontos pro operador falar com o cliente no WhatsApp sem digitar.
// No card só entram os genéricos; na página de detalhe, com o contexto,
// aparecem também lembrete da próxima reserva, cobrança do que está em
// aberto e aviso de mensal vencendo — só quando fazem sentido.
export function modelosMensagemCliente(
  nome: string,
  siteUrl: string,
  contexto: ContextoMensagem = {}
): ModeloMensagem[] {
  const saudacao = `Olá, ${primeiroNome(nome)}! Aqui é da Arena JR.`;
  const linkReserva = siteUrl ? `${siteUrl.replace(/\/$/, "")}/reservar` : null;
  const modelos: ModeloMensagem[] = [];

  const { proximaReserva, emAberto, mensalAtivoAte, pix } = contexto;

  if (proximaReserva) {
    modelos.push({
      id: "lembrete",
      label: "Lembrar da reserva",
      descricao: `${formatarDataLonga(proximaReserva.inicio)}, ${formatarHora(proximaReserva.inicio)}`,
      icone: CalendarCheck,
      texto: [
        saudacao,
        "Passando pra lembrar da sua reserva:",
        "",
        `📅 ${formatarDataLonga(proximaReserva.inicio)}`,
        `⏰ ${formatarHora(proximaReserva.inicio)} às ${formatarHora(proximaReserva.fim)}`,
        `📍 ${proximaReserva.modalidade} · ${proximaReserva.quadra}`,
        "",
        "Te esperamos!",
      ].join("\n"),
    });
  }

  if (emAberto && emAberto.length > 0) {
    const total = emAberto.reduce((soma, item) => soma + item.valorCentavos, 0);
    modelos.push({
      id: "cobranca",
      label: "Cobrar valor em aberto",
      descricao: `${formatarPreco(total)}${pix ? " com a chave Pix" : ""}`,
      icone: Banknote,
      texto: [
        saudacao,
        `Ficou em aberto ${formatarPreco(total)}:`,
        "",
        ...emAberto.map((item) => `• ${item.titulo} — ${formatarPreco(item.valorCentavos)}`),
        "",
        pix ? `Pix: ${pix.chave}` : null,
        pix ? `Titular: ${pix.titular}` : null,
        pix ? "" : null,
        "Assim que pagar, é só mandar o comprovante por aqui. Obrigado!",
      ]
        .filter((linha) => linha !== null)
        .join("\n"),
    });
  }

  if (mensalAtivoAte) {
    const dias = Math.ceil((mensalAtivoAte.getTime() - Date.now()) / 86_400_000);
    if (dias <= DIAS_AVISO_MENSAL) {
      modelos.push({
        id: "mensal",
        label: "Renovar mensal",
        descricao: `Vence ${formatarDataLonga(mensalAtivoAte)}`,
        icone: RefreshCw,
        texto: mensagemRenovacaoPlano({ nome, fim: mensalAtivoAte, vencido: false, pix }),
      });
    }
  }

  modelos.push({
    id: "convite",
    label: "Convidar pra jogar",
    descricao: "Chama pra marcar um horário",
    icone: CalendarPlus,
    texto: [
      `${saudacao} Bora marcar um jogo essa semana? 🎾`,
      linkReserva ? `Dá pra reservar direto pelo site: ${linkReserva}` : "É só responder aqui com o dia e horário.",
    ].join("\n"),
  });

  modelos.push({
    id: "agradecimento",
    label: "Agradecer a visita",
    descricao: "Obrigado por jogar com a gente",
    icone: Hand,
    texto: `${saudacao} Obrigado por jogar com a gente! Qualquer coisa, estamos por aqui. Até a próxima!`,
  });

  modelos.push({
    id: "livre",
    label: "Outra mensagem",
    descricao: "Abre a conversa só com a saudação",
    icone: MessageCircle,
    texto: `${saudacao} `,
  });

  return modelos;
}
