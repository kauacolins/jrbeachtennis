-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT,
    "descricao" TEXT,
    "data" TIMESTAMP(3),
    "imagem" BYTEA,
    "imagemTipo" TEXT,
    "imagemAtualizadaEm" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);
