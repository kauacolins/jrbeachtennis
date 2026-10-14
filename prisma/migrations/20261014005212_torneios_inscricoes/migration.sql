-- CreateEnum
CREATE TYPE "StatusInscricao" AS ENUM ('PENDENTE', 'CONFIRMADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Inscricao" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "criadaPorId" TEXT NOT NULL,
    "nomeEquipe" TEXT,
    "valorCentavos" INTEGER NOT NULL,
    "status" "StatusInscricao" NOT NULL DEFAULT 'PENDENTE',
    "pagoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtletaInscrito" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "userId" TEXT,
    "nome" TEXT NOT NULL,
    "celular" TEXT NOT NULL,

    CONSTRAINT "AtletaInscrito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inscricao_categoriaId_status_idx" ON "Inscricao"("categoriaId", "status");

-- CreateIndex
CREATE INDEX "AtletaInscrito_celular_idx" ON "AtletaInscrito"("celular");

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_criadaPorId_fkey" FOREIGN KEY ("criadaPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtletaInscrito" ADD CONSTRAINT "AtletaInscrito_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "Inscricao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtletaInscrito" ADD CONSTRAINT "AtletaInscrito_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
