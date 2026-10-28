import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
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

// Admin inicial, com credenciais vindas do .env (SEED_ADMIN_*). Cria User +
// Account "credential" direto via Prisma, no mesmo formato do Better Auth
// (ver criarUsuario). Se a conta já existir, garante o papel ADMIN e
// sincroniza a senha com o .env.
async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.SEED_ADMIN_PASSWORD;
  const nome = process.env.SEED_ADMIN_NAME?.trim() || "Administrador";

  if (!email || !senha) {
    console.warn("SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD ausentes — admin não criado.");
    return;
  }
  if (senha.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.");
  }

  const senhaHash = await hashPassword(senha);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: { role: "ADMIN", removidoEm: null },
      create: { name: nome, email, role: "ADMIN", emailVerified: true },
    });

    const credencial = await tx.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (credencial) {
      await tx.account.update({
        where: { id: credencial.id },
        data: { password: senhaHash },
      });
    } else {
      await tx.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: senhaHash,
        },
      });
    }
  });

  console.log(`Admin ${email} pronto.`);
}

// RF30: cardápio real do bar (folha da geladeira, 2026-10-28). O mesmo
// conteúdo existe em prisma/sql/cardapio-bar.sql pra rodar direto no banco.
// Categoria precisa bater com uma opção ativa do grupo categoria_produto
// (Bebida/Comida, criadas na migration select_group_option).
async function seedProdutosBar() {
  const produtos: { nome: string; categoria: "Bebida" | "Comida"; precoCentavos: number }[] = [
    { nome: "Água", categoria: "Bebida", precoCentavos: 300 },
    { nome: "H2O", categoria: "Bebida", precoCentavos: 600 },
    { nome: "Água com gás", categoria: "Bebida", precoCentavos: 400 },
    { nome: "Refrigerante lata", categoria: "Bebida", precoCentavos: 500 },
    { nome: "Coca-Cola 2L", categoria: "Bebida", precoCentavos: 1500 },
    { nome: "Guaraná 2L", categoria: "Bebida", precoCentavos: 1400 },
    { nome: "Monster", categoria: "Bebida", precoCentavos: 1400 },
    { nome: "Gatorade", categoria: "Bebida", precoCentavos: 900 },
    { nome: "Red Bull Zero", categoria: "Bebida", precoCentavos: 1200 },
    { nome: "Red Bull", categoria: "Bebida", precoCentavos: 1000 },
    { nome: "Heineken", categoria: "Bebida", precoCentavos: 1000 },
    { nome: "Corona", categoria: "Bebida", precoCentavos: 1000 },
    { nome: "Brahma", categoria: "Bebida", precoCentavos: 500 },
    { nome: "Cabaré Ice", categoria: "Bebida", precoCentavos: 900 },
    { nome: "Império Gold", categoria: "Bebida", precoCentavos: 600 },
    { nome: "Império Ultra", categoria: "Bebida", precoCentavos: 700 },
  ];

  for (const produto of produtos) {
    const existente = await prisma.produtoBar.findFirst({ where: { nome: produto.nome } });
    if (existente) {
      await prisma.produtoBar.update({ where: { id: existente.id }, data: produto });
    } else {
      await prisma.produtoBar.create({ data: produto });
    }
  }

  console.log(`Seed de produtos do bar concluído (${produtos.length}).`);
}

async function main() {
  await seedAdmin();

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

  await seedProdutosBar();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
