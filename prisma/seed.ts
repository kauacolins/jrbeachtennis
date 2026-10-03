import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Funcionamento padrão: todos os dias, 16:00 às 22:00.
const HORARIO_PADRAO = Array.from({ length: 7 }, (_, diaSemana) => ({
  diaSemana,
  abreMin: 16 * 60,
  fechaMin: 22 * 60,
}));

async function seedModalidades() {
  const nomes = ["Beach Tennis", "Futevôlei", "Vôlei", "Queimada"];

  const modalidades = await Promise.all(
    nomes.map((nome) =>
      prisma.modalidade.upsert({
        where: { nome },
        update: {},
        create: { nome },
      })
    )
  );

  return Object.fromEntries(modalidades.map((m) => [m.nome, m]));
}

async function seedQuadra(
  nome: string,
  modalidadeIds: string[],
  opcoes: {
    precoHoraCentavos?: number;
    descricao?: string;
    fotoUrl?: string;
    nomeAntigo?: string; // para renomear uma quadra já seedada antes
  } = {}
) {
  const { precoHoraCentavos = 6000, descricao, fotoUrl, nomeAntigo } = opcoes;

  const existente =
    (await prisma.quadra.findFirst({ where: { nome } })) ??
    (nomeAntigo
      ? await prisma.quadra.findFirst({ where: { nome: nomeAntigo } })
      : null);

  const quadra = existente
    ? await prisma.quadra.update({
        where: { id: existente.id },
        data: {
          nome,
          precoHoraCentavos,
          descricao,
          fotoUrl,
          modalidades: { set: modalidadeIds.map((id) => ({ id })) },
        },
      })
    : await prisma.quadra.create({
        data: {
          nome,
          precoHoraCentavos,
          descricao,
          fotoUrl,
          modalidades: { connect: modalidadeIds.map((id) => ({ id })) },
        },
      });

  await Promise.all(
    HORARIO_PADRAO.map((horario) =>
      prisma.horarioFuncionamento.upsert({
        where: {
          quadraId_diaSemana: {
            quadraId: quadra.id,
            diaSemana: horario.diaSemana,
          },
        },
        update: { abreMin: horario.abreMin, fechaMin: horario.fechaMin },
        create: { ...horario, quadraId: quadra.id },
      })
    )
  );

  return quadra;
}

async function main() {
  const modalidades = await seedModalidades();

  await seedQuadra(
    "Quadra 1 - Beach Tennis",
    [modalidades["Beach Tennis"].id, modalidades["Queimada"].id],
    {
      descricao: "Areia renovada, iluminação noturna e rede profissional.",
      fotoUrl: "https://picsum.photos/seed/arena-jr-quadra-1/800/600",
    }
  );
  await seedQuadra(
    "Quadra 2 - Beach Tennis",
    [modalidades["Beach Tennis"].id, modalidades["Queimada"].id],
    {
      descricao:
        "Quadra coberta, ideal para jogar mesmo com chuva ou sol forte.",
      fotoUrl: "https://picsum.photos/seed/arena-jr-quadra-2/800/600",
    }
  );
  await seedQuadra(
    "Quadra 3 - Multiuso",
    [modalidades["Futevôlei"].id, modalidades["Vôlei"].id],
    {
      precoHoraCentavos: 8000,
      descricao: "Areia funda, rede de vôlei de praia e espaço para futevôlei.",
      fotoUrl: "https://picsum.photos/seed/arena-jr-quadra-3/800/600",
      nomeAntigo: "Quadra 3 - Society",
    }
  );

  console.log("Seed de quadras concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
