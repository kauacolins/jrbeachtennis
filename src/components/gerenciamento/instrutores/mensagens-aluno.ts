import { Banknote, CalendarX, Hand, MessageCircle, Receipt, RefreshCw, TriangleAlert } from "lucide-react";
import { formatarDataLonga, formatarPreco } from "@/lib/format";
import { rotuloMetodo } from "@/lib/pagamento";
import { primeiroNome, type ModeloMensagem } from "@/components/gerenciamento/clientes/mensagens-cliente";
import type { PixArena } from "@/components/gerenciamento/reserva-detalhe-painel";
import type { SituacaoAluno } from "@/features/instrutores/regras";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";

const DIA_MS = 86_400_000;
const DIAS_BOAS_VINDAS = 7;
const DIAS_RECIBO = 3;

export interface ContextoAluno {
  nome: string;
  instrutor: string;
  plano: string;
  precoCentavos: number;
  horario: string | null;
  situacao: SituacaoAluno;
  ativo: boolean;
  validoAte: Date | null;
  emAbertoCentavos: number;
  mesesEmAberto: number;
  ultimoPagamento: Date | null;
  ultimoMetodo?: MetodoPagamento | null;
  matriculadoEm: Date;
  pix: PixArena | null;
}

function linhasPix(pix: PixArena | null) {
  return pix ? ["", `Pix: ${pix.chave}`, `Titular: ${pix.titular}`] : [];
}

// Modelos prontos pro operador falar com o aluno no WhatsApp (mesma ideia
// de modelosMensagemCliente). Só entram os que fazem sentido pra situação
// do aluno: aviso de vencimento, vencido, cobrança, recibo e boas-vindas
// aparecem quando cabem; aula cancelada e mensagem livre, sempre.
export function modelosMensagemAluno(ctx: ContextoAluno, agora = new Date()): ModeloMensagem[] {
  const saudacao = `Olá, ${primeiroNome(ctx.nome)}! Aqui é da Arena JR, sobre suas aulas com ${ctx.instrutor}.`;
  const valor = `Valor: ${formatarPreco(ctx.precoCentavos)} (${ctx.plano})`;
  const modelos: ModeloMensagem[] = [];

  if (ctx.ativo && agora.getTime() - ctx.matriculadoEm.getTime() <= DIAS_BOAS_VINDAS * DIA_MS) {
    modelos.push({
      id: "boas-vindas",
      label: "Boas-vindas",
      descricao: ctx.plano,
      icone: Hand,
      texto: [
        saudacao,
        "Seja bem-vindo(a)! Sua matrícula está feita. 🎾",
        "",
        `📋 Plano: ${ctx.plano} · ${formatarPreco(ctx.precoCentavos)}`,
        ctx.horario ? `⏰ Horário: ${ctx.horario}` : null,
        ctx.validoAte ? `📅 Primeiro vencimento: ${formatarDataLonga(ctx.validoAte)}` : null,
        "",
        "Qualquer dúvida, é só chamar por aqui.",
      ]
        .filter((l) => l !== null)
        .join("\n"),
    });
  }

  if (ctx.emAbertoCentavos > 0) {
    modelos.push({
      id: "cobranca",
      label: "Cobrar mensalidade em aberto",
      descricao: `${formatarPreco(ctx.emAbertoCentavos)}${ctx.pix ? " com a chave Pix" : ""}`,
      icone: Banknote,
      texto: [
        saudacao,
        ctx.mesesEmAberto > 1
          ? `Ficaram ${ctx.mesesEmAberto} mensalidades em aberto, total de ${formatarPreco(ctx.emAbertoCentavos)}.`
          : `Sua mensalidade de ${formatarPreco(ctx.emAbertoCentavos)} está em aberto.`,
        ...linhasPix(ctx.pix),
        "",
        ctx.pix
          ? "Assim que pagar, é só mandar o comprovante por aqui. Obrigado!"
          : "Dá pra acertar no balcão na próxima aula. Obrigado!",
      ].join("\n"),
    });
  }

  if (ctx.ativo && ctx.situacao === "VENCENDO" && ctx.validoAte) {
    modelos.push({
      id: "vencendo",
      label: "Avisar vencimento",
      descricao: `Vence ${formatarDataLonga(ctx.validoAte)}`,
      icone: RefreshCw,
      texto: [
        saudacao,
        `Sua mensalidade vence ${formatarDataLonga(ctx.validoAte)}. Bora renovar? O mês novo começa quando o atual acabar, sem perder nenhuma aula.`,
        valor,
        ...linhasPix(ctx.pix),
        "",
        ctx.pix ? "Assim que pagar, é só mandar o comprovante por aqui." : "É só responder aqui ou acertar no balcão.",
      ].join("\n"),
    });
  }

  if (ctx.situacao === "VENCIDO" && ctx.validoAte) {
    modelos.push({
      id: "vencido",
      label: "Mensalidade vencida",
      descricao: `Venceu ${formatarDataLonga(ctx.validoAte)}`,
      icone: TriangleAlert,
      texto: [
        saudacao,
        `Sua mensalidade venceu ${formatarDataLonga(ctx.validoAte)}. Bora renovar pra continuar as aulas?`,
        valor,
        ...linhasPix(ctx.pix),
        "",
        ctx.pix ? "Assim que pagar, é só mandar o comprovante por aqui." : "É só responder aqui ou acertar no balcão.",
      ].join("\n"),
    });
  }

  if (
    ctx.ultimoPagamento &&
    ctx.emAbertoCentavos === 0 &&
    agora.getTime() - ctx.ultimoPagamento.getTime() <= DIAS_RECIBO * DIA_MS
  ) {
    modelos.push({
      id: "recibo",
      label: "Confirmar pagamento",
      descricao: "Recibo simples do mês pago",
      icone: Receipt,
      texto: [
        saudacao,
        "Recebemos seu pagamento, obrigado! ✅",
        "",
        `📋 ${ctx.plano} · ${formatarPreco(ctx.precoCentavos)}`,
        ctx.ultimoMetodo ? `💳 ${rotuloMetodo(ctx.ultimoMetodo)}` : null,
        ctx.validoAte ? `📅 Válido até ${formatarDataLonga(ctx.validoAte)}` : null,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    });
  }

  if (ctx.ativo) {
    modelos.push({
      id: "aula-cancelada",
      label: "Aula cancelada ou remarcada",
      descricao: "Completa o dia e o motivo antes de enviar",
      icone: CalendarX,
      texto: `${saudacao}\nA aula de ___ foi ___. `,
    });
  }

  modelos.push({
    id: "livre",
    label: "Outra mensagem",
    descricao: "Abre a conversa só com a saudação",
    icone: MessageCircle,
    texto: `${saudacao} `,
  });

  return modelos;
}
