# Instrutores e alunos (plano de implementação)

Complementa `docs/REQUISITOS.md` (RF20, RN11) e `docs/COMANDAS.md` (plano mensal no balcão).
Status: **plano, nada implementado ainda.** As decisões em aberto estão no fim, cada uma com um padrão sugerido; o plano abaixo já segue esses padrões.

## Pedido (Kaua, 2026-11-05)

Um módulo de instrutor: cada instrutor tem seus alunos, com a **mesma estrutura do mensal** (Mensalistas), **cobrança mensal do aluno** e **mensagens prontas** para mandar no WhatsApp (renovação, vencimento etc.).

## Ponto de partida: como o mensal funciona hoje

| Peça | Onde | O que faz |
| --- | --- | --- |
| `Produto` tipo `MENSAL` | `prisma/schema.prisma` | Um preço único para todos, `duracaoDias = 30` |
| `Assinatura` | `prisma/schema.prisma` | Um período pago: `inicio`, `fim`, `valorCentavos` congelado, `pago`, `metodo`, `canceladaEm` |
| `listarPlanos` / `ativarPlano` / `cancelarPlano` | `src/features/planos/actions/planos.ts` | Lista o último período de cada cliente (todos, ativos, vencendo em 7 dias, vencidos). Renovar começa no `fim` do vigente, sem perder dias |
| `PlanosLista` | `src/components/gerenciamento/planos/planos-lista.tsx` | Abas com contagem, card com bolinha verde/laranja/vermelha, renovar com `SeletorMetodo`, botão de WhatsApp |
| `mensagemRenovacaoPlano` / `modelosMensagemCliente` | `src/components/gerenciamento/clientes/mensagens-cliente.ts` | Texto pronto, com Pix da arena quando configurado |
| `linkWhatsapp` | `src/lib/whatsapp.ts` | Monta o link `wa.me` com a mensagem |
| `widget-pendencias` | `src/components/gerenciamento/dashboard/` | "Mensalistas vencendo" no dashboard |
| `Role.INTRUCTOR` | `prisma/schema.prisma` | Já existe (com o erro de digitação) e já dá para criar conta de instrutor em Equipe, mas não tem tela nem permissão própria |

O módulo novo copia essa forma. Três diferenças:

1. **O preço é do instrutor**, não da arena inteira. Cada instrutor tem seus planos (ex.: "2x por semana R$ 200", "1x por semana R$ 120").
2. **O aluno pertence a um instrutor.** Uma pessoa pode ser aluna de dois instrutores, com uma mensalidade em cada.
3. **A mensalidade pode ficar em aberto.** O mensal de hoje só nasce pago, no balcão. Na aula o normal é o mês começar e o aluno pagar depois, então o período nasce `pago = false` e o sistema cobra.

## Modelo de dados

Migration nova (`prisma/migrations/2026MMDD_instrutores_alunos`). O aluno reutiliza o `Cliente` (cadastro do balcão, nome + telefone), assim o mesmo cadastro serve para day use, reserva, mensal e aula.

```prisma
// Instrutor da arena. Pode existir sem conta (o admin cadastra só nome e
// telefone); quando ganhar login, liga ao User de papel INTRUCTOR.
model Instrutor {
  id                String          @id @default(cuid())
  nome              String
  telefone          String?         // só dígitos
  userId            String?         @unique
  user              User?           @relation(fields: [userId], references: [id])
  repassePercentual Int?            // 0–100: parte do instrutor no que a arena recebe (decisão 1)
  ativo             Boolean         @default(true)
  planos            PlanoAula[]
  alunos            Aluno[]
  createdAt         DateTime        @default(now())
}

// Preço de aula do instrutor. Mesmo papel do Produto MENSAL, só que por instrutor.
model PlanoAula {
  id              String        @id @default(cuid())
  instrutorId     String
  instrutor       Instrutor     @relation(fields: [instrutorId], references: [id])
  nome            String        // "2x por semana"
  precoCentavos   Int
  duracaoDias     Int           @default(30)
  ativo           Boolean       @default(true)
  alunos          Aluno[]
  mensalidades    Mensalidade[]
}

// Vínculo aluno ↔ instrutor (a "matrícula"). Uma por par; sair e voltar
// reativa a mesma linha.
model Aluno {
  id           String        @id @default(cuid())
  instrutorId  String
  instrutor    Instrutor     @relation(fields: [instrutorId], references: [id])
  clienteId    String
  cliente      Cliente       @relation(fields: [clienteId], references: [id])
  planoAulaId  String        // plano atual; a mensalidade congela o valor
  planoAula    PlanoAula     @relation(fields: [planoAulaId], references: [id])
  horario      String?       // texto livre: "ter e qui 19h" (decisão 3)
  observacao   String?
  ativo        Boolean       @default(true)
  mensalidades Mensalidade[]
  createdAt    DateTime      @default(now())

  @@unique([instrutorId, clienteId])
}

// Um mês de aula. Mesma forma da Assinatura, mais o pagamento que pode vir depois.
// Em dia = pago, não cancelada e inicio <= agora < fim (igual à RN11).
model Mensalidade {
  id            String           @id @default(cuid())
  alunoId       String
  aluno         Aluno            @relation(fields: [alunoId], references: [id])
  planoAulaId   String
  planoAula     PlanoAula        @relation(fields: [planoAulaId], references: [id])
  inicio        DateTime         // UTC
  fim           DateTime         // inicio + duracaoDias
  valorCentavos Int              // congelado
  pago          Boolean          @default(false)
  pagoEm        DateTime?
  metodo        MetodoPagamento?
  canceladaEm   DateTime?
  createdAt     DateTime         @default(now())

  @@index([alunoId, fim])
}
```

Também entram as relações inversas em `User` (`instrutor Instrutor?`) e `Cliente` (`aulas Aluno[]`).

### Regras

- **Situação do aluno** (calculada, como em `listarPlanos`), olhando a mensalidade mais recente:
  - **Em dia:** período vigente e pago.
  - **Vence em breve:** em dia e `fim` em até 7 dias (mesma constante `DIAS_AVISO_VENCIMENTO`).
  - **Em aberto:** período vigente, mas `pago = false`. É o caso novo, que não existe no mensal.
  - **Vencido:** nenhum período vigente (venceu e não renovou) ou cancelado.
- **Renovar** (`renovarMensalidade`) segue `ativarPlano`: o novo período começa no `fim` do vigente, ou agora se não houver. Congela o preço do plano atual do aluno. Pode ser lançado já pago (com `metodo`) ou em aberto.
- **Registrar pagamento** (`registrarPagamento`) marca `pago`, `pagoEm` e `metodo` numa mensalidade em aberto.
- **Trocar de plano** muda `Aluno.planoAulaId` e só vale a partir da próxima mensalidade.
- **Desativar aluno** cancela as mensalidades futuras (igual a `cancelarPlano`) e põe `ativo = false`; o histórico fica.
- **Desativar instrutor** só é permitido sem alunos ativos (ou desativa todos junto, com confirmação).
- Valores em centavos, datas em UTC, `date-fns-tz` para exibir em America/Sao_Paulo, como no resto do repo.

## Server actions (`src/features/instrutores/`)

Um arquivo por ação, como nos outros domínios, com schema zod em `schema.ts`:

| Ação | Quem | O que faz |
| --- | --- | --- |
| `listar-instrutores.ts` | admin, operador | Instrutores ativos com contagem de alunos por situação |
| `salvar-instrutor.ts` | só admin | Cria/edita nome, telefone, repasse, ativo, e liga a uma conta INTRUCTOR existente |
| `salvar-plano-aula.ts` | só admin | Cria/edita planos e preços do instrutor |
| `listar-alunos.ts` | admin, operador (instrutor na fase 2) | Equivalente a `listarPlanos(filtro)`, filtrado por instrutor, com abas Todos, Em dia, Vencendo, Em aberto, Vencidos |
| `matricular-aluno.ts` | admin, operador | Escolhe o cliente (`BuscarCliente`), o plano e cria `Aluno` + a primeira `Mensalidade` (paga ou em aberto) numa transação |
| `renovar-mensalidade.ts` | admin, operador | Ver regra acima |
| `registrar-pagamento.ts` | admin, operador | Ver regra acima |
| `desativar-aluno.ts` | admin, operador | Ver regra acima |
| `relatorio-repasse.ts` | só admin | Por mês e por instrutor: total recebido, parte do instrutor, parte da arena (decisão 1) |

Permissão com `exigirAdmin` / `exigirSomenteAdmin` de `src/lib/require-admin.ts`. Na fase 2 entra `exigirInstrutor()`, que devolve o `Instrutor` ligado ao usuário e força o filtro `instrutorId` em toda consulta.

## Mensagens prontas (`src/components/gerenciamento/instrutores/mensagens-aluno.ts`)

Mesmo formato de `ModeloMensagem` e o mesmo `linkWhatsapp`. A saudação cita o instrutor: "Olá, Ana! Aqui é da Arena JR, sobre suas aulas com o Prof. Bruno." Os modelos aparecem só quando fazem sentido, como já acontece no detalhe do cliente:

| Modelo | Quando aparece | Conteúdo |
| --- | --- | --- |
| Boas-vindas | Logo depois de matricular | Plano, horário, valor e data do primeiro vencimento |
| Vai vencer | Em dia, vence em até 7 dias | "Sua mensalidade vence dia X. Quer renovar?" + valor + Pix |
| Venceu | Vencido | "Sua mensalidade venceu dia X. Bora renovar pra continuar as aulas?" + valor + Pix |
| Cobrança em aberto | Período vigente sem pagamento | Valor, mês de referência, Pix, "manda o comprovante por aqui" |
| Pagamento confirmado | Logo depois de registrar pagamento | Recibo simples: valor, forma, válido até |
| Aula cancelada / remarcada | Sempre (texto com campo para completar) | Saudação + "a aula de ___ foi ___" |
| Outra mensagem | Sempre | Só a saudação |

`mensagemRenovacaoPlano` passa a receber um parâmetro `assunto` ("plano mensal" ou "mensalidade das aulas com o Prof. X") para os dois módulos usarem o mesmo texto base, em vez de duplicar.

O Pix da mensagem é o da arena (`PIX_CHAVE_ARENA`) pelo padrão da decisão 1. Se a decisão for "o instrutor recebe direto", entra `Instrutor.pixChave` e a mensagem usa a chave dele.

## Telas

Seguem a skill `admin-panel-ui` (`.claude/skills`) e reaproveitam os componentes de Mensalistas.

1. **Sidebar:** item "Instrutores" no grupo de Clientes/Mensalistas em `gerenciamento-nav.tsx`.
2. **`/gerenciamento/instrutores`:** cards dos instrutores (nome, alunos em dia / vencendo / em aberto / vencidos). Admin vê "Novo instrutor".
3. **`/gerenciamento/instrutores/[id]`:** cópia adaptada de `PlanosLista`. Abas com contagem e busca por nome, card do aluno com bolinha de situação, plano, horário e vencimento. Ações no card: Renovar, Registrar pagamento, WhatsApp (menu de modelos, como `mensagem-cliente-menu.tsx`) e Desativar. Botão "Matricular aluno". Uma aba "Planos e preços" para o admin.
4. **Detalhe do cliente** (`cliente-detalhe.tsx`): bloco "Aulas" com os instrutores do cliente e a situação de cada.
5. **Dashboard** (`widget-pendencias.tsx`): "Mensalidades de aula vencendo" e "Mensalidades em aberto", com link para a aba certa.
6. **Relatório de repasse** (admin): mês × instrutor, com total recebido e parte de cada um. Pode ser uma aba na própria página do instrutor.

Para ser fácil de revisar, `PlanosLista` não precisa ser generalizada agora. A tela de alunos nasce como cópia adaptada e, se as duas continuarem iguais, depois se extrai um componente comum.

## Fases

**Fase 1, que já resolve o pedido** (cerca de 1 PR):
1. Migration e modelos acima.
2. Actions de instrutor, plano, matrícula, renovação, pagamento e desativação.
3. Telas 1 a 3, com as mensagens prontas.
4. Itens 4 e 5 (detalhe do cliente e dashboard).
5. Atualizar `docs/REQUISITOS.md` com os RFs novos e este doc com o que foi decidido.

**Fase 2:**
- Login do instrutor: área `/instrutor` (ou `/gerenciamento` restrito) onde o INTRUCTOR vê só os próprios alunos, renova e manda as mensagens. Em `exigirAdmin` nada muda; entra `exigirInstrutor`.
- Relatório de repasse (item 6), se a decisão 1 for "arena recebe e repassa".
- Mensalidade como item de comanda (`TipoItemComanda.MENSALIDADE`), para o aluno pagar junto com o bar.
- Horário fixo da turma gerando `Bloqueio` semanal na quadra (`Bloqueio.instrutorId`), se a decisão 3 for "aula trava quadra".

**Fase 3:** cobrança automática (Pix recorrente / Asaas, ver `PAGAMENTOS.md` na pasta do projeto) e o aluno vendo a própria mensalidade no site.

## Decisões em aberto (para o Kaua)

| # | Pergunta | Padrão sugerido | Alternativas |
| --- | --- | --- | --- |
| 1 | Quem recebe o dinheiro da mensalidade? | **A arena recebe** (balcão ou Pix da arena) e o sistema calcula o repasse do instrutor por percentual | O instrutor recebe direto e o sistema só controla quem pagou (Pix do instrutor nas mensagens); ou o instrutor paga aluguel fixo à arena |
| 2 | O instrutor tem login próprio? | **Não na fase 1.** Admin e operador cuidam de tudo; login vem na fase 2 usando o papel INTRUCTOR que já existe | Já na fase 1, com o instrutor vendo só os próprios alunos |
| 3 | A aula reserva quadra? | **Não automaticamente.** O horário fica como texto no aluno; se precisar travar, o operador cria um Bloqueio | Turma com horário fixo gerando bloqueio semanal (fase 2) |
| 4 | Como conta o vencimento? | **Igual ao mensal:** 30 dias a partir do início, e renovar começa no fim do anterior | Dia fixo do mês (ex.: todo dia 10), mais comum em escolinha |
| 5 | Mensalidade de aula dá direito a day use? | **Não**, são coisas separadas | Aluno ganha day use grátis ou com desconto |
| 6 | Preço por instrutor ou da arena? | **Por instrutor** (cada um com seus planos) | Tabela única da arena para todos |
| 7 | Corrigir `INTRUCTOR` para `INSTRUTOR`? | **Sim**, na mesma migration (renomear valor do enum no Postgres não perde dados) | Deixar como está |
