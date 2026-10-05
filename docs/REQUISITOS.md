# Requisitos: Sistema de Reserva de Quadras

Site para reservar horários em quadras de beach tennis, futebol, vôlei e outras modalidades, e vender day use e plano mensal.

**Stack:** Next.js (App Router, TypeScript) + Prisma + PostgreSQL.

## 1. Escopo do MVP

**Dentro do MVP**

- Um único estabelecimento (um dono, várias quadras).
- Várias modalidades. Uma quadra pode ter mais de uma modalidade.
- Reserva de quadra por hora (blocos de 60 min).
- Day use (entrada livre o dia todo) e plano mensal.
- Login com e-mail e senha ou com Google.
- Reserva de quadra: pagamento via Pix (Mercado Pago) direto no fluxo, sem redirecionar pra fora do site. Reserva nasce PENDENTE_PAGAMENTO com 15 min pra pagar (ver RN9); sem Mercado Pago configurado no ambiente, cai de volta pro fluxo antigo (CONFIRMADA direto). Reserva manual do admin (RF14) continua sem Pix.
- Day use e mensal: pagamento combinado no local, o sistema registra e o admin marca como pago (ainda não online).
- Painel administrativo simples para o dono.

**Fora do MVP** (ver seção 9)

- Pagamento online pra day use/mensal, assinatura recorrente automática, vários estabelecimentos, horário fixo semanal, app mobile, notificações por WhatsApp.

## 2. Perfis de usuário

| Perfil | Quem é | O que pode fazer |
| --- | --- | --- |
| Visitante | Qualquer pessoa sem login | Ver quadras, modalidades, preços e horários livres |
| Cliente | Jogador com conta | Tudo do visitante + reservar quadra, comprar day use, ver e cancelar as próprias reservas, ver o plano mensal, editar perfil |
| Admin | Dono ou gerente do espaço | Cadastrar quadras, horários e preços, bloquear horários, ver a agenda, criar reserva manual, cancelar qualquer reserva, gerenciar day use e planos, marcar pagamento e presença |

## 3. Produtos e preços

Os preços ficam no banco e são editáveis pelo admin, nunca fixos no código.

| Produto | Preço | Quem paga | Como funciona |
| --- | --- | --- | --- |
| Diária (aluguel de quadra) | R$ 60 por hora | O grupo, por reserva | Reserva exclusiva da quadra no horário. 2 horas = R$ 120. Preço por hora fica na quadra |
| Day use | R$ 15 por pessoa | Cada pessoa | Entrada livre no espaço o dia todo, sem quadra exclusiva e sem horário. O cliente compra o passe para uma data; o admin confere a lista na entrada. Limite diário de pessoas opcional |
| Mensal | R$ 120 por pessoa | Cada pessoa | Plano de 30 dias que dá day use livre: com o plano ativo, o passe do dia sai por R$ 0. O admin ativa ao receber o pagamento e o sistema mostra quando vence |

Quem está de day use joga nas quadras que estiverem livres. Para garantir uma quadra para o day use, o admin usa o bloqueio de horário (RF12).

## 4. Requisitos funcionais

| ID | Requisito | Perfil | Prioridade |
| --- | --- | --- | --- |
| RF01 | Cadastro com nome, e-mail, celular e senha, ou entrada com Google (celular pedido no primeiro acesso, sem verificação) | Cliente | Essencial |
| RF02 | Login e logout com e-mail e senha ou com conta Google | Cliente, Admin | Essencial |
| RF03 | Recuperar senha por link enviado ao e-mail | Cliente | Desejável |
| RF04 | Listar quadras com modalidades, foto, descrição e preço por hora | Todos | Essencial |
| RF05 | Filtrar quadras por modalidade | Todos | Desejável |
| RF06 | Ver a agenda de uma quadra por dia, com horários livres e ocupados | Todos | Essencial |
| RF07 | Reservar um horário livre (quadra, modalidade, data, hora de início, duração) | Cliente | Essencial |
| RF08 | Ver "Minhas reservas" (próximas e passadas) | Cliente | Essencial |
| RF09 | Cancelar a própria reserva dentro do prazo | Cliente | Essencial |
| RF10 | CRUD de quadras (nome, uma ou mais modalidades, preço por hora, ativa/inativa) | Admin | Essencial |
| RF11 | Definir horário de funcionamento por quadra e dia da semana | Admin | Essencial |
| RF12 | Bloquear horários pontuais (manutenção, evento, feriado, day use) | Admin | Essencial |
| RF13 | Agenda geral do dia com todas as quadras | Admin | Essencial |
| RF14 | Criar reserva manual para cliente sem conta (nome + telefone) | Admin | Essencial |
| RF15 | Cancelar qualquer reserva e marcar pago / não compareceu | Admin | Desejável |
| RF16 | E-mail de confirmação e de cancelamento da reserva | Cliente | Desejável |
| RF17 | Cadastrar e editar produtos e preços (day use, mensal) | Admin | Essencial |
| RF18 | Ver a lista de day use do dia, marcar presença e definir limite diário opcional | Admin | Essencial |
| RF19 | Comprar passe de day use para uma data, enquanto houver vaga | Cliente | Essencial |
| RF20 | Ativar, renovar e cancelar o plano mensal de um cliente; ver quem está vencido | Admin | Essencial |
| RF21 | Ver o próprio plano mensal e a data de vencimento | Cliente | Desejável |

## 5. Regras de negócio

Os valores abaixo são padrões e devem ficar configuráveis.

1. **Sem conflito:** uma reserva só é criada se o intervalo [início, fim) não sobrepõe outra reserva ativa nem um bloqueio da mesma quadra. A checagem roda no servidor, em transação. Vale para a quadra inteira: se ela serve beach tennis e vôlei, uma reserva de vôlei ocupa o horário para as duas.
2. **Modalidade válida:** a modalidade da reserva precisa ser uma das modalidades da quadra.
3. **Dentro do funcionamento:** início e fim dentro do horário de funcionamento da quadra naquele dia da semana.
4. **Blocos de 1 hora:** duração múltipla de 60 min (mínimo 1 h, máximo 3 h). Início sempre em hora cheia.
5. **Antecedência:** não dá para reservar horário que já passou; janela de até 30 dias à frente.
6. **Limite por cliente:** no máximo 2 reservas futuras ativas por cliente.
7. **Cancelamento pelo cliente:** até 24 h antes do início. Depois disso, só o admin cancela.
8. **Preço congelado:** o valor da reserva (preço/hora × horas) e o do passe são salvos na criação; mudar o preço depois não altera o que já foi vendido.
9. **Status da reserva:** com pagamento via Pix configurado, nasce PENDENTE_PAGAMENTO e tem 15 min para o Pix cair — não caindo a tempo, vira CANCELADA sozinha e libera o horário (sem job/cron: cada leitura relevante expira as pendentes vencidas antes de checar conflito, ver `expirarReservasPendentes`). Sem Mercado Pago configurado no ambiente, nasce CONFIRMADA direto, como antes. A partir de CONFIRMADA pode virar CANCELADA, CONCLUIDA ou NAO_COMPARECEU. Cancelada libera o horário. Reserva manual do admin (RF14) sempre nasce CONFIRMADA, sem Pix — pagamento combinado no local, como day use/mensal.
10. **Day use:** um passe por pessoa por data. Se houver limite diário, a compra é bloqueada quando lota. Com plano mensal ativo na data, o passe custa R$ 0 e fica ligado ao plano.
11. **Plano mensal:** vale de `inicio` até `inicio + 30 dias`. Ativo = pago e dentro da validade.
12. **Fuso horário:** datas salvas em UTC e exibidas em America/Sao_Paulo.
13. **Quadra inativa:** não aparece para reserva, mas mantém o histórico.

## 6. Requisitos não funcionais

| ID | Categoria | Requisito |
| --- | --- | --- |
| RNF01 | Stack | Next.js (App Router, TypeScript), Prisma, PostgreSQL. Server Actions ou Route Handlers para as operações |
| RNF02 | Autenticação | Better Auth (ou Auth.js) com e-mail e senha e login Google. O e-mail é a identidade: entrar pelo Google com e-mail já cadastrado liga à mesma conta. Senha com hash (bcrypt/argon2), mínimo de 8 caracteres, limite de tentativas por IP. Sessão em cookie httpOnly |
| RNF03 | Autorização | Toda rota de admin e toda mutação checam o perfil no servidor, nunca só no front |
| RNF04 | Integridade | Criação de reserva em transação; constraint de exclusão no PostgreSQL impede sobreposição mesmo com cliques simultâneos (ver seção 7) |
| RNF05 | Validação | Entradas validadas no servidor com Zod |
| RNF06 | Usabilidade | Mobile first. Reserva em até 3 toques a partir da agenda |
| RNF07 | Desempenho | Agenda do dia carrega em menos de 1 s com até 10 quadras |
| RNF08 | Privacidade | LGPD: coletar só nome, e-mail e celular; permitir excluir a conta. CPF é exceção pontual: só é pedido na hora de gerar o Pix da reserva (exigência do Mercado Pago), nunca salvo na Reserva — passa direto pra API de pagamento, não fica em repouso no banco |
| RNF09 | Hospedagem | Vercel (app) + banco gerenciado (Neon, Supabase ou Railway) |
| RNF10 | Qualidade | Testes das regras de negócio (conflito, prazo, limite, day use); migrations versionadas com `prisma migrate` |
| RNF11 | Custo | Login sem custo por acesso. E-mails (recuperação de senha, confirmação) no plano grátis de um serviço como o Resend |

## 7. Modelo de dados (Prisma)

Esboço inicial. As tabelas de sessão e de token de recuperação de senha vêm da biblioteca de auth e ficam de fora.

```prisma
enum Role {
  CLIENTE
  ADMIN
}

enum StatusReserva {
  CONFIRMADA
  CANCELADA
  CONCLUIDA
  NAO_COMPARECEU
}

enum TipoProduto {
  DAY_USE // por pessoa, por dia
  MENSAL  // por pessoa, 30 dias
}

model User {
  id            String        @id @default(cuid())
  nome          String
  email         String        @unique
  emailVerified DateTime?
  senhaHash     String?       // nulo para quem só entra com Google
  telefone      String?       // contato; pedido no primeiro acesso via Google
  imagem        String?       // foto do Google
  role          Role          @default(CLIENTE)
  contas        Account[]
  reservas      Reserva[]
  passes        PasseDayUse[]
  assinaturas   Assinatura[]
  createdAt     DateTime      @default(now())
}

// Login social (Google)
model Account {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider          String    // "google"
  providerAccountId String
  accessToken       String?
  refreshToken      String?
  idToken           String?
  expiresAt         DateTime?

  @@unique([provider, providerAccountId])
}

model Modalidade {
  id       String    @id @default(cuid())
  nome     String    @unique // Beach tennis, Futebol, Vôlei...
  quadras  Quadra[]  // muitos-para-muitos
  reservas Reserva[]
}

model Quadra {
  id                String                 @id @default(cuid())
  nome              String
  descricao         String?
  fotoUrl           String?
  precoHoraCentavos Int                    @default(6000) // diária: R$ 60/h
  ativa             Boolean                @default(true)
  modalidades       Modalidade[]           // muitos-para-muitos
  horarios          HorarioFuncionamento[]
  bloqueios         Bloqueio[]
  reservas          Reserva[]
}

// Um registro por dia da semana em que a quadra abre
model HorarioFuncionamento {
  id        String @id @default(cuid())
  quadraId  String
  quadra    Quadra @relation(fields: [quadraId], references: [id])
  diaSemana Int    // 0 = domingo ... 6 = sábado
  abreMin   Int    // minutos desde 00:00, ex.: 480 = 08:00
  fechaMin  Int    // ex.: 1380 = 23:00

  @@unique([quadraId, diaSemana])
}

model Bloqueio {
  id       String   @id @default(cuid())
  quadraId String
  quadra   Quadra   @relation(fields: [quadraId], references: [id])
  inicio   DateTime
  fim      DateTime
  motivo   String?

  @@index([quadraId, inicio])
}

model Reserva {
  id              String        @id @default(cuid())
  quadraId        String
  quadra          Quadra        @relation(fields: [quadraId], references: [id])
  modalidadeId    String        // precisa ser uma das modalidades da quadra
  modalidade      Modalidade    @relation(fields: [modalidadeId], references: [id])
  userId          String?       // nulo em reserva manual sem conta
  user            User?         @relation(fields: [userId], references: [id])
  nomeContato     String?       // reserva manual
  telefoneContato String?
  inicio          DateTime      // UTC
  fim             DateTime      // UTC
  valorCentavos   Int           // preço congelado
  status          StatusReserva @default(CONFIRMADA)
  pago            Boolean       @default(false)
  canceladaEm     DateTime?
  createdAt       DateTime      @default(now())

  @@index([quadraId, inicio])
  @@index([userId])
}

model Produto {
  id            String       @id @default(cuid())
  nome          String
  tipo          TipoProduto  @unique
  precoCentavos Int          // 1500 (day use), 12000 (mensal)
  duracaoDias   Int?         // 30 no mensal
  limiteDiario  Int?         // day use: máximo de pessoas por dia (opcional)
  ativo         Boolean      @default(true)
  assinaturas   Assinatura[]
}

// Passe de day use: entrada livre o dia todo
model PasseDayUse {
  id            String      @id @default(cuid())
  data          DateTime    @db.Date
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  valorCentavos Int         // 0 quando coberto pelo mensal
  assinaturaId  String?     // plano que cobriu o passe
  assinatura    Assinatura? @relation(fields: [assinaturaId], references: [id])
  pago          Boolean     @default(false)
  presenteEm    DateTime?   // check-in na entrada
  cancelado     Boolean     @default(false)
  createdAt     DateTime    @default(now())

  @@unique([data, userId])
  @@index([data])
}

// Plano mensal
model Assinatura {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  produtoId     String
  produto       Produto       @relation(fields: [produtoId], references: [id])
  inicio        DateTime
  fim           DateTime      // início + 30 dias
  valorCentavos Int
  pago          Boolean       @default(false)
  passes        PasseDayUse[]
  createdAt     DateTime      @default(now())

  @@index([userId, fim])
}
```

Notas:

- Dinheiro em centavos (`Int`) para evitar erro de arredondamento.
- A proteção contra sobreposição (RNF04) vai numa migration SQL manual, porque o Prisma não declara `EXCLUDE`:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Reserva" ADD CONSTRAINT sem_sobreposicao
  EXCLUDE USING gist ("quadraId" WITH =, tstzrange(inicio, fim) WITH &&)
  WHERE (status <> 'CANCELADA');
```

## 8. Decisões tomadas

- Uma quadra pode ter mais de uma modalidade.
- Login com e-mail e senha + Google. Celular só como contato, sem verificação.
- Diária = R$ 60 por hora de quadra. Day use = R$ 15, entrada livre o dia todo. Mensal = R$ 120 por 30 dias.
- O mensal dá day use livre: com a assinatura ativa, o passe do dia sai por R$ 0 (modelo `Produto`/`Assinatura`/`PasseDayUse` da seção 7).

**Em aberto**

- [ ] Um espaço só ou vender para vários espaços desde o início?
- [ ] Blocos de 60 min servem para todas as modalidades?
- [ ] Prazo de cancelamento de 24 h está bom?
- [ ] Pagamento no local no MVP está ok, ou sinal via Pix já é obrigatório?

## 9. Fase robusta (pós-MVP)

| Ordem | Funcionalidade | O que muda no sistema |
| --- | --- | --- |
| 1 | Pagamento online pra day use/mensal, e cartão como opção além do Pix na reserva | Reserva via Pix já saiu do MVP (ver seção 1/RN9) — falta extrapolar pro Produto/Assinatura/PasseDayUse (seção 7) e, se quiser, cartão via Mercado Pago |
| 2 | Notificações por WhatsApp/SMS | Lembrete 2 h antes, confirmação e cancelamento; fila de jobs (Inngest, QStash, BullMQ) |
| 3 | Horário fixo semanal | Recorrência (toda terça 20h) que gera reservas e trata conflitos |
| 4 | Política de cancelamento e reembolso | Reembolso parcial por prazo, créditos na conta |
| 5 | Preço dinâmico | Preço por faixa de horário e dia (horário nobre, fim de semana), feriados |
| 6 | Vários estabelecimentos (multi-tenant) | Modelo Estabelecimento acima de Quadra; slug por cliente; planos de assinatura |
| 7 | Perfis extras | Recepcionista com permissões limitadas; professor com aulas |
| 8 | Aulas e torneios | Reserva com várias vagas e inscrição individual |
| 9 | Dividir a conta | Convidar jogadores e cada um paga a sua parte |
| 10 | Lista de espera | Avisar quando um horário ocupado for liberado |
| 11 | Relatórios | Ocupação por quadra e horário, faturamento, não comparecimento, day use por dia |
| 12 | Infra e qualidade | Testes E2E (Playwright), Sentry, rate limit, backups, auditoria de ações do admin |
| 13 | App mobile / PWA | Instalável no celular, notificações push |
| 14 | Login por WhatsApp | Código por WhatsApp (pago por mensagem) ou "código invertido" via API oficial |
