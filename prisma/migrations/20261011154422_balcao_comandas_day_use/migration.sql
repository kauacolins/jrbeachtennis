-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO');

-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('DAY_USE', 'MENSAL');

-- CreateEnum
CREATE TYPE "TipoItemComanda" AS ENUM ('BAR', 'DAY_USE', 'RESERVA');

-- CreateEnum
CREATE TYPE "StatusComanda" AS ENUM ('ABERTA', 'FECHADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "tipo" "TipoProduto" NOT NULL,
    "nome" TEXT NOT NULL,
    "precoCentavos" INTEGER NOT NULL,
    "duracaoDias" INTEGER,
    "limiteDiario" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasseDayUse" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "assinaturaId" TEXT,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "metodo" "MetodoPagamento",
    "pagoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasseDayUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "metodo" "MetodoPagamento",
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoBar" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "precoCentavos" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProdutoBar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comanda" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "status" "StatusComanda" NOT NULL DEFAULT 'ABERTA',
    "totalCentavos" INTEGER NOT NULL DEFAULT 0,
    "metodo" "MetodoPagamento",
    "abertaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadaEm" TIMESTAMP(3),

    CONSTRAINT "Comanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemComanda" (
    "id" TEXT NOT NULL,
    "comandaId" TEXT NOT NULL,
    "tipo" "TipoItemComanda" NOT NULL DEFAULT 'BAR',
    "descricao" TEXT NOT NULL,
    "produtoId" TEXT,
    "passeId" TEXT,
    "reservaId" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "precoUnitarioCentavos" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemComanda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_telefone_key" ON "Cliente"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_userId_key" ON "Cliente"("userId");

-- CreateIndex
CREATE INDEX "Cliente_nome_idx" ON "Cliente"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_tipo_key" ON "Produto"("tipo");

-- CreateIndex
CREATE INDEX "PasseDayUse_data_idx" ON "PasseDayUse"("data");

-- CreateIndex
CREATE INDEX "PasseDayUse_clienteId_data_idx" ON "PasseDayUse"("clienteId", "data");

-- CreateIndex
CREATE INDEX "Assinatura_clienteId_fim_idx" ON "Assinatura"("clienteId", "fim");

-- CreateIndex
CREATE INDEX "Comanda_status_nome_idx" ON "Comanda"("status", "nome");

-- CreateIndex
CREATE INDEX "Comanda_abertaEm_idx" ON "Comanda"("abertaEm");

-- CreateIndex
CREATE UNIQUE INDEX "ItemComanda_passeId_key" ON "ItemComanda"("passeId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemComanda_reservaId_key" ON "ItemComanda"("reservaId");

-- CreateIndex
CREATE INDEX "ItemComanda_comandaId_idx" ON "ItemComanda"("comandaId");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasseDayUse" ADD CONSTRAINT "PasseDayUse_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasseDayUse" ADD CONSTRAINT "PasseDayUse_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasseDayUse" ADD CONSTRAINT "PasseDayUse_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "Assinatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComanda" ADD CONSTRAINT "ItemComanda_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComanda" ADD CONSTRAINT "ItemComanda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "ProdutoBar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComanda" ADD CONSTRAINT "ItemComanda_passeId_fkey" FOREIGN KEY ("passeId") REFERENCES "PasseDayUse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComanda" ADD CONSTRAINT "ItemComanda_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Campo certo por tipo de item (docs/COMANDAS.md).
ALTER TABLE "ItemComanda" ADD CONSTRAINT item_tipo_ok CHECK (
  (tipo = 'BAR'     AND "produtoId" IS NOT NULL AND "passeId" IS NULL AND "reservaId" IS NULL) OR
  (tipo = 'DAY_USE' AND "passeId"   IS NOT NULL AND "produtoId" IS NULL AND "reservaId" IS NULL) OR
  (tipo = 'RESERVA' AND "reservaId" IS NOT NULL AND "produtoId" IS NULL AND "passeId" IS NULL)
);

ALTER TABLE "ItemComanda" ADD CONSTRAINT item_quantidade_ok CHECK (quantidade > 0);

-- RF17: produtos de day use e mensal já nascem com os preços do REQUISITOS.md
-- (editáveis depois em /gerenciamento/produtos).
INSERT INTO "Produto" ("id", "tipo", "nome", "precoCentavos", "duracaoDias", "limiteDiario", "ativo") VALUES
  ('produto_day_use', 'DAY_USE', 'Day use', 1500, NULL, NULL, true),
  ('produto_mensal', 'MENSAL', 'Plano mensal', 12000, 30, NULL, true);
