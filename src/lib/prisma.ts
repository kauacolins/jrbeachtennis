import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// O padrão do Prisma (5s por transação interativa) não cabe com o banco no
// Neon: cada ida e volta custa centenas de ms e as regras de comanda/day use
// fazem ~10 consultas em sequência — estourava com "expired transaction".
// As transações continuam curtas; isso só dá folga pra latência da rede.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    transactionOptions: { maxWait: 10_000, timeout: 20_000 },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
