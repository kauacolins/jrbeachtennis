# Campeonatos e torneios

Complementa `docs/REQUISITOS.md` (seção 9, item 8) e `docs/PAGAMENTOS.md`. Status: rascunho, com padrões assumidos onde o Kaua ainda não decidiu. Modelo de referência: Torneio Beneficente da Arena JR (artes de categorias e programação prévia, outubro de 2026).

## Decidido (Kaua)

- **2026-10-13: pagamento confirmado à mão pelo admin** na primeira versão (Pix para a chave da arena). Pix automático via Asaas é fase seguinte.
- **2026-10-13: inscrição pendente não expira sozinha.** Sem prazo — a vaga fica reservada até o admin confirmar o pagamento ou cancelar a inscrição à mão. Isso tira `EXPIRADA` e `expiraEm` do modelo (ver "Modelo de dados").
- **2026-10-13: torneio de referência sem limite de categorias por atleta.** `maxCategoriasAtleta` fica nulo nesse torneio (campo opcional — vazio = sem limite); outros torneios podem continuar usando o padrão de 2.
- **2026-10-14: horário previsto saiu do cadastro de categoria.** O campo `inicioPrevisto` continua no modelo, mas por agora ninguém o edita — a programação prévia (passo 7) decide isso depois, quando as inscrições fecharem.

## Como o torneio beneficente funcionou

- Três formatos: **simples**, **duplas** e **mistas**.
- Níveis: B, C, D, Iniciante e Open. Nem todo nível existe em todo formato (feminino não teve B; mista teve C, D, Iniciante e Open).
- Cada categoria tem um **horário de início** na programação prévia, distribuída em 3 dias (quinta e sexta à noite, sábado o dia todo). Duas categorias podem começar no mesmo horário em quadras diferentes (sábado 21:30).
- Divulgação: arte de categorias e arte de programação no Instagram.

## Ideia: torneio genérico (pedido do Kaua, 2026-10-13)

O torneio não conhece "simples", "dupla" ou "mista". Cada **categoria** diz só três coisas: de qual **modalidade** é, um **nome livre** e **quantas pessoas formam uma inscrição**. Com isso o mesmo cadastro serve para:

| Modalidade | Categoria (nome livre) | Atletas por inscrição |
| --- | --- | --- |
| Beach tennis | Simples Masc. C | 1 |
| Beach tennis | Dupla Feminina Open | 2 |
| Beach tennis | Mista Iniciante | 2 |
| Vôlei de praia | Dupla Masculina | 2 |
| Futevôlei | Dupla Open | 2 |
| Futebol society | Livre | 7 a 12 (time com reservas) |

Gênero e nível deixam de ser campos com regra: viram parte do nome da categoria ("Dupla Masc. C"). O admin escreve como quiser, e o sistema não valida nível nem gênero (já não validava).

## Banner na home (pedido do Kaua, 2026-10-13)

- No cadastro do torneio, o admin sobe um **banner vertical** e marca "Destacar na home".
- Tamanho: **1080 x 1350 px (4:5, vertical, formato de post do Instagram)**, JPG ou WebP até 1 MB. A mesma arte serve pro site e pras redes. O cadastro avisa (sem bloquear) quando a imagem sai dessa proporção, porque aí as bordas são cortadas. (Trocado do antigo 1920 x 640 horizontal em 2026-10-18.)
- A home mostra o banner logo abaixo do hero. Clicar leva para `/torneios/[slug]`.
- Aparece só se o torneio não for rascunho nem cancelado e estiver dentro do prazo de destaque (`destaqueAte`, ou o último dia do torneio se vazio). Depois disso some sozinho.
- Os destacados aparecem como fileira de pôsteres (rolagem lateral no celular, grade no desktop), ordenados pela data do torneio.
- O mesmo banner aparece no topo da página do torneio.
- A imagem vai para um armazenamento de arquivos (Vercel Blob ou Supabase Storage), e o banco guarda só a URL.

## O que o sistema faz (primeira versão)

1. **Admin cria o torneio**: nome, descrição/regulamento, datas, período de inscrição, doação (opcional, para beneficentes), limite de categorias por atleta e banner da home.
2. **Admin cadastra as categorias**: modalidade, nome, mínimo e máximo de atletas por inscrição, valor da inscrição e vagas (opcional). Um torneio pode misturar modalidades.
3. **Admin reserva as quadras do torneio**: escolhe quadras e períodos; o sistema cria `Bloqueio`s ligados ao torneio, e a agenda de reservas deixa de oferecer esses horários.
4. **Página pública do torneio** (`/torneios/[slug]`): categorias agrupadas por modalidade e programação por dia, geradas pelos dados, com botão de inscrição. O link vai na bio do Instagram.
5. **Inscrição pelo site** (cliente logado): escolhe a categoria e preenche os atletas. Com 1 atleta é só ele; com 2 ou mais, informa nome e celular dos outros (que não precisam ter conta) e, se for time, o nome do time.
6. **Lista de inscritos** por categoria, pública (só nomes) e no admin (com celular e status de pagamento), com exportação para planilha.
7. Ao fechar as inscrições, o admin ajusta horários e publica a programação final. Chaves e placares ficam fora desta versão.

## Padrões assumidos (confirmar)

- **Um pagamento por inscrição**: o valor da categoria é o da inscrição inteira (atleta, dupla ou time), e quem inscreve paga. Mais simples que cobrar cada atleta e serve igual para time de futebol. Se a dupla quiser dividir, resolve entre eles.
- **Limite padrão de 2 categorias por atleta**, configurável por torneio; vazio = sem limite (caso do torneio de referência).
- Um atleta não pode estar duas vezes na mesma categoria (checado pelo celular).

## Modelo de dados (Prisma, a somar ao de `REQUISITOS.md`)

```prisma
enum StatusTorneio {
  RASCUNHO             // só o admin vê
  INSCRICOES_ABERTAS
  INSCRICOES_ENCERRADAS
  EM_ANDAMENTO
  FINALIZADO
  CANCELADO
}

enum StatusInscricao {
  PENDENTE    // aguardando pagamento, sem prazo — segura a vaga até confirmar ou cancelar
  CONFIRMADA  // paga
  CANCELADA
}

model Torneio {
  id                  String        @id @default(cuid())
  slug                String        @unique // "beneficente-2026"
  nome                String
  descricao           String?       // regulamento, premiação, kit
  doacao              String?       // ex.: "1 kg de alimento não perecível"
  bannerUrl           String?       // banner vertical 1080x1350 (home, lista, página do torneio e modal de novidades)
  destaqueHome        Boolean       @default(false) // mostrar o banner na home
  destaqueAte         DateTime?     // some da home depois disso; vazio = até dataFim
  dataInicio          DateTime      @db.Date
  dataFim             DateTime      @db.Date
  inscricoesAbrem     DateTime
  inscricoesFecham    DateTime
  maxCategoriasAtleta Int?          @default(2) // vazio = sem limite
  status              StatusTorneio @default(RASCUNHO)
  categorias          Categoria[]
  bloqueios           Bloqueio[]    // quadras reservadas para o torneio
  createdAt           DateTime      @default(now())
}

model Categoria {
  id             String      @id @default(cuid())
  torneioId      String
  torneio        Torneio     @relation(fields: [torneioId], references: [id], onDelete: Cascade)
  modalidadeId   String
  modalidade     Modalidade  @relation(fields: [modalidadeId], references: [id])
  nome           String      // "Dupla Masc. C", "Simples Feminino D", "Livre"
  minAtletas     Int         @default(1)
  maxAtletas     Int         @default(1) // 2 na dupla; ex.: 12 no futebol
  valorCentavos  Int         // por inscrição
  vagas          Int?        // nº máximo de inscrições
  inicioPrevisto DateTime?   // programação prévia
  ordem          Int         @default(0) // ordem de exibição
  inscricoes     Inscricao[]

  @@unique([torneioId, nome])
}

// Uma inscrição = um atleta, uma dupla ou um time
model Inscricao {
  id            String           @id @default(cuid())
  categoriaId   String
  categoria     Categoria        @relation(fields: [categoriaId], references: [id])
  criadaPorId   String           // quem fez a inscrição e paga
  criadaPor     User             @relation(fields: [criadaPorId], references: [id])
  nomeEquipe    String?          // só para times
  valorCentavos Int              // preço congelado
  status        StatusInscricao  @default(PENDENTE)
  pagoEm        DateTime?
  atletas       AtletaInscrito[]
  createdAt     DateTime         @default(now())

  @@index([categoriaId, status])
}

model AtletaInscrito {
  id          String    @id @default(cuid())
  inscricaoId String
  inscricao   Inscricao @relation(fields: [inscricaoId], references: [id], onDelete: Cascade)
  userId      String?   // nulo para quem não tem conta
  user        User?     @relation(fields: [userId], references: [id])
  nome        String
  celular     String    // só dígitos; usado para checar duplicidade
}
```

Mudanças nos modelos existentes:

- `Bloqueio` ganha `torneioId String?` + relação, para saber quais bloqueios são do torneio e removê-los juntos.
- `Modalidade` ganha a relação `categorias Categoria[]`.
- `User` ganha as relações `inscricoesCriadas Inscricao[]` e `inscricoesComoAtleta AtletaInscrito[]`.

## Regras

- Só aceita inscrição com o torneio em `INSCRICOES_ABERTAS` e dentro de `inscricoesAbrem`/`inscricoesFecham`.
- Vaga ocupada = inscrições `PENDENTE` + `CONFIRMADA` (pendente não expira sozinha). Checar em transação, como no day use.
- O número de atletas da inscrição fica entre `minAtletas` e `maxAtletas` da categoria.
- Limite por atleta: contar inscrições ativas do mesmo celular no torneio contra `maxCategoriasAtleta` (pula a checagem se for nulo).
- Cancelar o torneio cancela as inscrições e remove os bloqueios dele.

## Telas

| Quem | Tela | O que tem |
| --- | --- | --- |
| Público | `/torneios` | Torneios com inscrição aberta e os próximos |
| Público | `/torneios/[slug]` | Descrição, categorias, programação por dia, inscritos, botão de inscrição |
| Cliente | Inscrição | Categoria, atletas (e nome do time), valor e instruções de pagamento |
| Cliente | Minhas inscrições | Status de cada inscrição e pagamento |
| Admin | Torneios | Criar/editar torneio, banner e destaque na home, categorias, horários, quadras bloqueadas |
| Público | Home | Pôsteres dos torneios destacados abaixo do hero |
| Admin | Inscritos | Lista por categoria, marcar pago, cancelar, exportar |

## Depois (fase seguinte)

- Pix automático (Asaas) na inscrição.
- Chaveamento: grupos ou eliminatória, sorteio e tabela de jogos com quadra e horário.
- Placar e resultados ao vivo; ranking da arena por modalidade.
- Regras por categoria, se fizer falta (gênero, idade).
- Gerar as artes de divulgação a partir dos dados.
- Avisos por WhatsApp (inscrição confirmada, horário do primeiro jogo).
