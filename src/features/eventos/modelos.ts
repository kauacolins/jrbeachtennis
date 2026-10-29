import {
  CalendarClock,
  CloudRain,
  GraduationCap,
  Martini,
  PartyPopper,
  Sparkles,
  Sun,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { dataParaISO, formatarHora, formatarPreco } from "@/lib/format";
import type { EventoAdmin } from "./actions/listar-eventos";

// Valores do formulário de evento (ver EventoForm). data é "yyyy-MM-dd" e
// hora "HH:mm", os dois opcionais.
export interface ValoresEvento {
  titulo: string;
  resumo: string;
  descricao: string;
  data: string;
  hora: string;
  exibicaoInicio: string;
  exibicaoFim: string;
  ativo: boolean;
}

export const VALORES_EVENTO_VAZIOS: ValoresEvento = {
  titulo: "",
  resumo: "",
  descricao: "",
  data: "",
  hora: "",
  exibicaoInicio: "",
  exibicaoFim: "",
  ativo: true,
};

export function valoresDoEvento(evento: EventoAdmin): ValoresEvento {
  return {
    titulo: evento.titulo,
    resumo: evento.resumo ?? "",
    descricao: evento.descricao ?? "",
    data: evento.data ? dataParaISO(evento.data) : "",
    hora: evento.data ? formatarHora(evento.data) : "",
    exibicaoInicio: evento.exibicaoInicio ? dataParaISO(evento.exibicaoInicio) : "",
    exibicaoFim: evento.exibicaoFim ? dataParaISO(evento.exibicaoFim) : "",
    ativo: evento.ativo,
  };
}

/** Modelo que precisa de uma escolha antes de preencher (ex.: qual quadra). */
export type ParametroModelo = "modalidade" | "quadra";

export interface ContextoModelo {
  hojeISO: string;
  precoDayUseCentavos: number | null;
  /** Nome da modalidade ou quadra escolhida, quando o modelo tem parametro. */
  opcao: string;
}

export interface ModeloEvento {
  id: string;
  nome: string;
  descricao: string;
  icone: LucideIcon;
  parametro?: ParametroModelo;
  valores: (ctx: ContextoModelo) => ValoresEvento;
}

// Sugestões de aviso prontas (tela de Eventos e widget do dashboard): ao
// escolher uma, a tela de cadastro abre com o texto já preenchido, e o admin
// só revisa e salva. Pra adicionar uma sugestão nova basta incluir aqui.
export const MODELOS_EVENTO: ModeloEvento[] = [
  {
    id: "day-use",
    nome: "Day use disponível hoje",
    descricao: "Avisa que dá pra passar o dia na arena.",
    icone: Sun,
    valores: ({ hojeISO, precoDayUseCentavos }) => ({
      ...VALORES_EVENTO_VAZIOS,
      titulo: "Day use liberado hoje",
      resumo: precoDayUseCentavos
        ? `Curta a arena o dia todo por ${formatarPreco(precoDayUseCentavos)}.`
        : "Curta a arena o dia todo.",
      descricao:
        "Hoje tem day use na Arena JR: chegue quando quiser e jogue à vontade. É só garantir seu passe na recepção.",
      data: hojeISO,
    }),
  },
  {
    id: "aula",
    nome: "Aula disponível hoje",
    descricao: "Divulga vagas numa aula de alguma modalidade.",
    icone: GraduationCap,
    parametro: "modalidade",
    valores: ({ hojeISO, opcao }) => ({
      ...VALORES_EVENTO_VAZIOS,
      titulo: `Aula de ${opcao} hoje`,
      resumo: "Ainda tem vaga — chame a gente pra garantir a sua.",
      descricao: `Hoje tem aula de ${opcao} na Arena JR, pra todos os níveis. Fale com a recepção pra reservar sua vaga.`,
      data: hojeISO,
    }),
  },
  {
    id: "aula-experimental",
    nome: "Aula experimental",
    descricao: "Primeira aula grátis pra quem quer começar.",
    icone: Sparkles,
    parametro: "modalidade",
    valores: ({ opcao }) => ({
      ...VALORES_EVENTO_VAZIOS,
      titulo: `Aula experimental de ${opcao}`,
      resumo: "Nunca jogou? A primeira aula é por nossa conta.",
      descricao: `Quer começar no ${opcao}? Venha fazer uma aula experimental gratuita com nossos professores. Vagas limitadas.`,
    }),
  },
  {
    id: "horarios-livres",
    nome: "Horários livres hoje",
    descricao: "Incentiva a reservar quadra no mesmo dia.",
    icone: CalendarClock,
    valores: ({ hojeISO }) => ({
      ...VALORES_EVENTO_VAZIOS,
      titulo: "Ainda tem horário livre hoje",
      resumo: "Reserve sua quadra pelo site em poucos cliques.",
      descricao: "Sobrou horário na agenda de hoje. Chame a galera e reserve sua quadra pelo site.",
      data: hojeISO,
    }),
  },
  {
    id: "manutencao",
    nome: "Manutenção na quadra",
    descricao: "Avisa que uma quadra fica fechada hoje.",
    icone: Wrench,
    parametro: "quadra",
    valores: ({ hojeISO, opcao }) => ({
      ...VALORES_EVENTO_VAZIOS,
      titulo: `${opcao} em manutenção`,
      resumo: `A ${opcao} fica fechada hoje para manutenção.`,
      descricao:
        "Estamos cuidando da quadra pra você jogar melhor. As outras quadras seguem funcionando normalmente.",
      data: hojeISO,
    }),
  },
  {
    id: "chuva",
    nome: "Quadras fechadas por chuva",
    descricao: "Aviso rápido pra dias de tempo ruim.",
    icone: CloudRain,
    valores: ({ hojeISO }) => ({
      ...VALORES_EVENTO_VAZIOS,
      titulo: "Quadras fechadas por causa da chuva",
      resumo: "Assim que secar, a gente reabre. Quem reservou pode remarcar.",
      descricao:
        "Por causa da chuva, as quadras estão fechadas por enquanto. Quem tem reserva hoje pode falar com a recepção pra remarcar sem custo.",
      data: hojeISO,
    }),
  },
  {
    id: "feriado",
    nome: "Horário especial no feriado",
    descricao: "Informa o funcionamento num feriado.",
    icone: PartyPopper,
    valores: () => ({
      ...VALORES_EVENTO_VAZIOS,
      titulo: "Horário especial no feriado",
      resumo: "Confira o horário de funcionamento da arena.",
      descricao: "No feriado a arena funciona em horário especial. Programe seu jogo!",
    }),
  },
  {
    id: "happy-hour",
    nome: "Happy hour no bar",
    descricao: "Promoção no bar depois do jogo.",
    icone: Martini,
    valores: ({ hojeISO }) => ({
      ...VALORES_EVENTO_VAZIOS,
      titulo: "Happy hour no bar hoje",
      resumo: "Bebidas com preço especial depois do jogo.",
      descricao: "Terminou o jogo? Fica pro happy hour: bebidas com preço especial no bar da arena.",
      data: hojeISO,
    }),
  },
];

export function obterModeloEvento(id: string | undefined) {
  return MODELOS_EVENTO.find((m) => m.id === id);
}

export function hrefModeloEvento(modelo: ModeloEvento, opcaoId?: string) {
  const params = new URLSearchParams({ modelo: modelo.id });
  if (opcaoId) params.set("opcao", opcaoId);
  return `/gerenciamento/eventos/novo?${params}`;
}
