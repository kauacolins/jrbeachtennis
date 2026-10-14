import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.torneio.deleteMany({
    where: { slug: { in: ["teste-smoke-card-com-foto", "teste-smoke-card-sem-foto"] } },
  });
  console.log("Removidos.");
}

main().finally(() => prisma.$disconnect());
