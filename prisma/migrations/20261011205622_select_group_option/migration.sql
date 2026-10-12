-- CreateTable
CREATE TABLE "SelectGroup" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "SelectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectOption" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SelectOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SelectGroup_chave_key" ON "SelectGroup"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "SelectOption_grupoId_nome_key" ON "SelectOption"("grupoId", "nome");

-- AddForeignKey
ALTER TABLE "SelectOption" ADD CONSTRAINT "SelectOption_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "SelectGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grupo de categorias de produto do bar, com as opções iniciais.
INSERT INTO "SelectGroup" ("id", "chave", "nome") VALUES
  ('select_categoria_produto', 'categoria_produto', 'Categoria de produto');

INSERT INTO "SelectOption" ("id", "grupoId", "nome", "ordem", "ativo") VALUES
  ('select_categoria_produto_bebida', 'select_categoria_produto', 'Bebida', 1, true),
  ('select_categoria_produto_comida', 'select_categoria_produto', 'Comida', 2, true);
