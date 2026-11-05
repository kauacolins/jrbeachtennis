-- Corrige o nome do papel (INTRUCTOR -> INSTRUTOR) sem perder as contas que
-- já têm esse papel.
ALTER TYPE "Role" RENAME VALUE 'INTRUCTOR' TO 'INSTRUTOR';

-- CreateTable
CREATE TABLE "Instrutor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "userId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Instrutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoAula" (
    "id" TEXT NOT NULL,
    "instrutorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "precoCentavos" INTEGER NOT NULL,
    "duracaoDias" INTEGER NOT NULL DEFAULT 30,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanoAula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" TEXT NOT NULL,
    "instrutorId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "planoAulaId" TEXT NOT NULL,
    "horario" TEXT,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensalidade" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "planoAulaId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "pagoEm" TIMESTAMP(3),
    "metodo" "MetodoPagamento",
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensalidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instrutor_userId_key" ON "Instrutor"("userId");

-- CreateIndex
CREATE INDEX "Instrutor_nome_idx" ON "Instrutor"("nome");

-- CreateIndex
CREATE INDEX "PlanoAula_instrutorId_idx" ON "PlanoAula"("instrutorId");

-- CreateIndex
CREATE INDEX "Aluno_clienteId_idx" ON "Aluno"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_instrutorId_clienteId_key" ON "Aluno"("instrutorId", "clienteId");

-- CreateIndex
CREATE INDEX "Mensalidade_alunoId_fim_idx" ON "Mensalidade"("alunoId", "fim");

-- AddForeignKey
ALTER TABLE "Instrutor" ADD CONSTRAINT "Instrutor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoAula" ADD CONSTRAINT "PlanoAula_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "Instrutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "Instrutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_planoAulaId_fkey" FOREIGN KEY ("planoAulaId") REFERENCES "PlanoAula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensalidade" ADD CONSTRAINT "Mensalidade_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensalidade" ADD CONSTRAINT "Mensalidade_planoAulaId_fkey" FOREIGN KEY ("planoAulaId") REFERENCES "PlanoAula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

