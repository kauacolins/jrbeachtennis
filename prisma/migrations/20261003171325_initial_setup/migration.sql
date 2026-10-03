-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'OPERATOR', 'INTRUCTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('CONFIRMADA', 'CANCELADA', 'CONCLUIDA', 'NAO_COMPARECEU');

-- CreateTable
CREATE TABLE "Modalidade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Modalidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quadra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "fotoUrl" TEXT,
    "precoHoraCentavos" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Quadra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorarioFuncionamento" (
    "id" TEXT NOT NULL,
    "quadraId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "abreMin" INTEGER NOT NULL,
    "fechaMin" INTEGER NOT NULL,

    CONSTRAINT "HorarioFuncionamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "quadraId" TEXT NOT NULL,
    "modalidadeId" TEXT NOT NULL,
    "userId" TEXT,
    "nomeContato" TEXT,
    "telefoneContato" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'CONFIRMADA',
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "senhaHash" TEXT,
    "telefone" TEXT,
    "imagem" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ModalidadeToQuadra" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModalidadeToQuadra_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Modalidade_nome_key" ON "Modalidade"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "HorarioFuncionamento_quadraId_diaSemana_key" ON "HorarioFuncionamento"("quadraId", "diaSemana");

-- CreateIndex
CREATE INDEX "Reserva_quadraId_inicio_idx" ON "Reserva"("quadraId", "inicio");

-- CreateIndex
CREATE INDEX "Reserva_userId_idx" ON "Reserva"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "_ModalidadeToQuadra_B_index" ON "_ModalidadeToQuadra"("B");

-- AddForeignKey
ALTER TABLE "HorarioFuncionamento" ADD CONSTRAINT "HorarioFuncionamento_quadraId_fkey" FOREIGN KEY ("quadraId") REFERENCES "Quadra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_quadraId_fkey" FOREIGN KEY ("quadraId") REFERENCES "Quadra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "Modalidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModalidadeToQuadra" ADD CONSTRAINT "_ModalidadeToQuadra_A_fkey" FOREIGN KEY ("A") REFERENCES "Modalidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModalidadeToQuadra" ADD CONSTRAINT "_ModalidadeToQuadra_B_fkey" FOREIGN KEY ("B") REFERENCES "Quadra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
