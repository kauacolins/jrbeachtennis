-- Cardápio real do bar da Arena JR (folha colada na geladeira, 2026-10-28).
-- Idempotente: atualiza o preço de quem já existe com o mesmo nome e insere
-- o resto. Não mexe em outros produtos. Todos na categoria "Bebida"
-- (opção do grupo categoria_produto).
-- Rodar: psql "$DATABASE_URL" -f prisma/sql/cardapio-bar.sql

BEGIN;

CREATE TEMP TABLE cardapio (nome TEXT, "precoCentavos" INTEGER) ON COMMIT DROP;

INSERT INTO cardapio (nome, "precoCentavos") VALUES
  ('Água', 300),
  ('H2O', 600),
  ('Água com gás', 400),
  ('Refrigerante lata', 500),
  ('Coca-Cola 2L', 1500),
  ('Guaraná 2L', 1400),
  ('Monster', 1400),
  ('Gatorade', 900),
  ('Red Bull Zero', 1200),
  ('Red Bull', 1000),
  ('Heineken', 1000),
  ('Corona', 1000),
  ('Brahma', 500),
  ('Cabaré Ice', 900),
  ('Império Gold', 600),
  ('Império Ultra', 700);

UPDATE "ProdutoBar" p
SET "precoCentavos" = c."precoCentavos", categoria = 'Bebida', ativo = true
FROM cardapio c
WHERE p.nome = c.nome;

INSERT INTO "ProdutoBar" (id, nome, categoria, "precoCentavos", ativo)
SELECT gen_random_uuid()::text, c.nome, 'Bebida', c."precoCentavos", true
FROM cardapio c
WHERE NOT EXISTS (SELECT 1 FROM "ProdutoBar" p WHERE p.nome = c.nome);

COMMIT;
