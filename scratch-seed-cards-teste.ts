import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const agora = new Date();
  await prisma.torneio.create({
    data: {
      slug: "teste-smoke-card-com-foto",
      nome: "Teste Smoke Card Com Foto",
      dataInicio: new Date("2026-11-01T00:00:00.000Z"),
      dataFim: new Date("2026-11-02T00:00:00.000Z"),
      inscricoesAbrem: new Date(agora.getTime() - 24 * 60 * 60 * 1000),
      inscricoesFecham: new Date(agora.getTime() + 24 * 60 * 60 * 1000),
      status: "INSCRICOES_ABERTAS",
      bannerUrl: "https://picsum.photos/seed/torneio-card-1/1920/640",
    },
  });
  await prisma.torneio.create({
    data: {
      slug: "teste-smoke-card-sem-foto",
      nome: "Teste Smoke Card Sem Foto",
      dataInicio: new Date("2026-12-01T00:00:00.000Z"),
      dataFim: new Date("2026-12-02T00:00:00.000Z"),
      inscricoesAbrem: new Date(agora.getTime() - 24 * 60 * 60 * 1000),
      inscricoesFecham: new Date(agora.getTime() + 24 * 60 * 60 * 1000),
      status: "INSCRICOES_ENCERRADAS",
    },
  });
  console.log("ok");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
