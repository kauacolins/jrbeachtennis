-- CreateEnum
CREATE TYPE "StatusTorneio" AS ENUM ('RASCUNHO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "Bloqueio" ADD COLUMN     "torneioId" TEXT;

-- CreateTable
CREATE TABLE "Torneio" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "doacao" TEXT,
    "bannerUrl" TEXT,
    "destaqueHome" BOOLEAN NOT NULL DEFAULT false,
    "destaqueAte" TIMESTAMP(3),
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "inscricoesAbrem" TIMESTAMP(3) NOT NULL,
    "inscricoesFecham" TIMESTAMP(3) NOT NULL,
    "maxCategoriasAtleta" INTEGER DEFAULT 2,
    "status" "StatusTorneio" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Torneio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "torneioId" TEXT NOT NULL,
    "modalidadeId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "minAtletas" INTEGER NOT NULL DEFAULT 1,
    "maxAtletas" INTEGER NOT NULL DEFAULT 1,
    "valorCentavos" INTEGER NOT NULL,
    "vagas" INTEGER,
    "inicioPrevisto" TIMESTAMP(3),
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Torneio_slug_key" ON "Torneio"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_torneioId_nome_key" ON "Categoria"("torneioId", "nome");

-- CreateIndex
CREATE INDEX "Bloqueio_torneioId_idx" ON "Bloqueio"("torneioId");

-- AddForeignKey
ALTER TABLE "Bloqueio" ADD CONSTRAINT "Bloqueio_torneioId_fkey" FOREIGN KEY ("torneioId") REFERENCES "Torneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_torneioId_fkey" FOREIGN KEY ("torneioId") REFERENCES "Torneio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "Modalidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
