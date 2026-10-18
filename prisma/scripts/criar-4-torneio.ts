import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { fromZonedTime } from "date-fns-tz";
import { PrismaClient } from "../../src/app/generated/prisma/client";

// Cadastra o 4º Torneio de Beach Tennis da Arena JR (docs/TORNEIOS.md).
// Idempotente: upsert pelo slug no torneio e por [torneioId, nome] nas
// categorias. Rodar: npx tsx prisma/scripts/criar-4-torneio.ts

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TIME_ZONE = "America/Sao_Paulo";

// Datas provisórias — confirmar antes de abrir as inscrições.
const DATA_INICIO = "2026-12-04"; // @db.Date, gravado como meia-noite UTC (igual salvarTorneio)
const DATA_FIM = "2026-12-06";
const DATAS_TEXTO = "04, 05 e 06 de dezembro de 2026";
const INSCRICOES_ABREM = "2026-10-20T08:00"; // horário de Brasília
const INSCRICOES_FECHAM = "2026-12-01T23:59";
const VAGAS_POR_CATEGORIA: number | null = null; // null = sem limite

const SLUG = "4-torneio-beach-tennis-2026";

const DESCRICAO = `Vem aí o 4º Torneio da Arena JR! 🎾🔥
Três dias de muita competição, resenha e aquele clima top que só a Arena JR proporciona!

💰 Inscrição: R$ 60,00 por atleta (dupla e mista: R$ 120,00 por dupla)
🏆 Premiação: R$ 5.000,00 garantidos!
📅 Datas: ${DATAS_TEXTO}
📍 Arena JR Beach Tennis, Brejo do Cruz-PB

Chame seu parceiro(a), monte sua dupla e venha fazer parte desse grande evento! ⚠️ Vagas limitadas!
Uma mega estrutura e muita energia ⚡️`;

// R$ 60 por atleta; o valor da categoria é da inscrição inteira.
const SIMPLES = { minAtletas: 1, maxAtletas: 1, valorCentavos: 6000 };
const DUPLA = { minAtletas: 2, maxAtletas: 2, valorCentavos: 12000 };

const CATEGORIAS = [
  ...[
    "Simples Masculino Open",
    "Simples Masculino C",
    "Simples Masculino D",
    "Simples Masculino Iniciante",
    "Simples Feminino C",
    "Simples Feminino D",
    "Simples Feminino Iniciante",
  ].map((nome) => ({ nome, ...SIMPLES })),
  ...[
    "Mista Open",
    "Mista C",
    "Mista D",
    "Mista Iniciante",
    "Dupla Masculino Open",
    "Dupla Masculino C",
    "Dupla Masculino D",
    "Dupla Masculino Iniciante",
    "Dupla Feminino C",
    "Dupla Feminino D",
    "Dupla Feminino Iniciante",
  ].map((nome) => ({ nome, ...DUPLA })),
];

async function main() {
  const modalidade = await prisma.modalidade.findUnique({ where: { nome: "Beach Tennis" } });
  if (!modalidade) {
    throw new Error('Modalidade "Beach Tennis" não encontrada. Rode a seed antes.');
  }

  const dados = {
    nome: "4º Torneio de Beach Tennis",
    descricao: DESCRICAO,
    doacao: null,
    dataInicio: new Date(`${DATA_INICIO}T00:00:00.000Z`),
    dataFim: new Date(`${DATA_FIM}T00:00:00.000Z`),
    inscricoesAbrem: fromZonedTime(INSCRICOES_ABREM, TIME_ZONE),
    inscricoesFecham: fromZonedTime(INSCRICOES_FECHAM, TIME_ZONE),
    maxCategoriasAtleta: null,
  };

  // Status, banner e destaque só na criação: rodar de novo não desfaz o
  // que o admin mudou em /gerenciamento (abrir inscrições, subir banner).
  const torneio = await prisma.torneio.upsert({
    where: { slug: SLUG },
    update: dados,
    create: {
      ...dados,
      slug: SLUG,
      status: "RASCUNHO",
      destaqueHome: true,
      destaqueAte: null,
    },
  });

  for (const [ordem, categoria] of CATEGORIAS.entries()) {
    const campos = {
      ...categoria,
      modalidadeId: modalidade.id,
      vagas: VAGAS_POR_CATEGORIA,
      ordem,
    };
    await prisma.categoria.upsert({
      where: { torneioId_nome: { torneioId: torneio.id, nome: categoria.nome } },
      update: campos,
      create: { ...campos, torneioId: torneio.id },
    });
  }

  const totalCategorias = await prisma.categoria.count({ where: { torneioId: torneio.id } });

  console.log(`Torneio: ${torneio.nome} (${torneio.status})`);
  console.log(`id: ${torneio.id}`);
  console.log(`Admin: /gerenciamento/torneios/${torneio.id}`);
  console.log(`Público: /torneios/${torneio.slug}`);
  console.log(`Categorias: ${totalCategorias}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
