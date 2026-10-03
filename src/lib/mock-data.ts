// Dados de seções que ainda não têm modelo no banco (ver docs/REQUISITOS.md,
// seção 7 "Fora do MVP" / seção 3 "Produtos e preços"). Formato pensado para
// bater com um futuro model `Produto` do Prisma — quando ele existir, troque
// estas funções por uma action em features/produtos.

export type TipoProduto = "DIARIA" | "DAY_USE" | "MENSAL";

export interface ProdutoMock {
  tipo: TipoProduto;
  nome: string;
  precoCentavos: number;
  unidade: string; // "por hora de quadra", "por pessoa", "por pessoa / 30 dias"
  descricao: string;
  destaque: boolean;
}

// RF17 / seção 3 do REQUISITOS.md — valores padrão, editáveis pelo admin.
export const PRODUTOS_MOCK: ProdutoMock[] = [
  {
    tipo: "DIARIA",
    nome: "Diária",
    precoCentavos: 6000,
    unidade: "por hora de quadra",
    descricao:
      "Reserva exclusiva da quadra no horário escolhido. 2 horas = R$ 120.",
    destaque: false,
  },
  {
    tipo: "DAY_USE",
    nome: "Day use",
    precoCentavos: 1500,
    unidade: "por pessoa, no dia",
    descricao:
      "Entrada livre no espaço o dia todo, jogando nas quadras que estiverem livres.",
    destaque: false,
  },
  {
    tipo: "MENSAL",
    nome: "Mensal",
    precoCentavos: 12000,
    unidade: "por pessoa, 30 dias",
    descricao: "Day use liberado por 30 dias — o passe do dia sai por R$ 0.",
    destaque: true,
  },
];

export interface AmenidadeMock {
  icone: "Waves" | "Sun" | "DoorOpen" | "SquareParking" | "Beer";
  label: string;
}

export const AMENIDADES_MOCK: AmenidadeMock[] = [
  { icone: "Waves", label: "Quadras de areia" },
  { icone: "Sun", label: "Iluminação para jogo à noite" },
  { icone: "DoorOpen", label: "Vestiário" },
  { icone: "SquareParking", label: "Estacionamento" },
  { icone: "Beer", label: "Bar e área de descanso" },
];

export interface DepoimentoMock {
  nome: string;
  modalidade: string;
  frase: string;
}

// TODO: substituir pelos depoimentos reais de quem joga na Arena JR.
export const DEPOIMENTOS_MOCK: DepoimentoMock[] = [
  { nome: "TODO", modalidade: "TODO", frase: "TODO" },
  { nome: "TODO", modalidade: "TODO", frase: "TODO" },
  { nome: "TODO", modalidade: "TODO", frase: "TODO" },
];

export interface ModalidadeFotoMock {
  slug: string;
  fotoLocal: string;
}

// Mapeia o nome da modalidade (como está no banco) para a foto local em
// public/images/. Troque por fotoUrl assim que o admin puder enviar fotos
// por modalidade.
export const FOTO_POR_MODALIDADE: Record<string, string> = {
  "beach tennis": "/images/beach-tennis.jpg",
  "futevôlei": "/images/futevolei.jpg",
  futevolei: "/images/futevolei.jpg",
  "vôlei": "/images/volei.jpg",
  volei: "/images/volei.jpg",
  queimada: "/images/queimada.jpg",
};
