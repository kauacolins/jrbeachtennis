# Instrutores e alunos

Complementa `docs/REQUISITOS.md` (RF20, RN11) e `docs/COMANDAS.md` (plano mensal no balcão).

## Decidido (Kaua)

- **2026-11-05, pedido:** módulo de instrutor. Cada instrutor tem seus alunos, com a **mesma estrutura do mensal** (Mensalistas), **cobrança mensal do aluno** e **mensagens prontas** para mandar no WhatsApp (renovação, vencimento etc.).
- **2026-11-05:** **sem repasse.** O sistema não calcula a parte do instrutor nem a da arena; só controla quem pagou e quem deve.
- **2026-11-05:** fase 1 implementada com os padrões abaixo.

## Padrões assumidos (dá para mudar depois)

| Ponto | Padrão | Alternativa |
| --- | --- | --- |
| Login do instrutor | Não tem na fase 1. Admin e operador cuidam de tudo pelo `/gerenciamento`. O papel `INSTRUTOR` já existe em Equipe e o `Instrutor.userId` fica pronto para a fase 2 | O instrutor entra e vê só os próprios alunos |
| Aula reserva quadra | Não. O horário é texto livre no aluno; para travar a quadra, o operador cria um Bloqueio | Turma com horário fixo gerando bloqueio semanal |
| Vencimento | Igual ao mensal: `duracaoDias` (30) a partir do início, e renovar começa no fim do período atual | Dia fixo do mês |
| Day use | A mensalidade de aula não dá day use | Aluno ganha day use grátis ou com desconto |
| Preço | Cada instrutor tem seus planos (`PlanoAula`) | Tabela única da arena |
| Pix nas mensagens | O da arena (`PIX_CHAVE_ARENA`) | Chave do instrutor |
| Quem mexe | Admin e operador: matricular, renovar, receber, editar aluno, saída. Só admin: cadastro do instrutor e planos/preços | |

A migration `20261105180000_instrutores_alunos` também corrigiu o nome do papel `INTRUCTOR` para `INSTRUTOR` (`ALTER TYPE ... RENAME VALUE`, as contas existentes continuam com o papel).

## Modelo de dados (`prisma/schema.prisma`)

O aluno reutiliza o `Cliente` (cadastro do balcão, nome + telefone), assim o mesmo cadastro serve para day use, reserva, mensal e aula.

- **`Instrutor`**: nome, telefone, `ativo`, `userId` opcional (conta de equipe, fase 2).
- **`PlanoAula`**: plano do instrutor (nome, `precoCentavos`, `duracaoDias`, `ativo`). Mesmo papel do `Produto` `MENSAL`, só que por instrutor.
- **`Aluno`**: matrícula `Cliente` ↔ `Instrutor` (`@@unique([instrutorId, clienteId])`), com o plano atual, horário, observação e `ativo`. Quem sai e volta reusa a mesma linha.
- **`Mensalidade`**: um período, igual à `Assinatura`, mais `pagoEm`. Pode nascer **em aberto** (`pago = false`), e esse é o caso novo em relação ao mensal.

## Regras (`src/features/instrutores/regras.ts`)

- **Situação do aluno**, olhando as mensalidades não canceladas:
  - **Em aberto:** tem alguma mensalidade sem pagamento (tem cobrança a fazer). Vale mais que as outras situações.
  - **Vencido:** nenhum período vigente.
  - **Vencendo:** vigente e vence em até 7 dias.
  - **Em dia:** o resto.
- **Matricular** cria o `Aluno` e o primeiro mês na mesma transação, pago (com forma de pagamento) ou em aberto.
- **Renovar** lança o próximo mês no preço atual do plano do aluno, começando no fim do período atual (ou agora, se venceu). Pode ser pago ou em aberto.
- **Receber** marca todas as mensalidades em aberto do aluno como pagas, na mesma forma de pagamento.
- **Editar** troca plano, horário e observação. O plano novo só vale na próxima mensalidade (valor congelado).
- **Saiu da turma** cancela os meses que ainda não começaram e o mês atual se estiver em aberto. O que já foi pago e dívidas de meses passados ficam no histórico.
- **Desativar instrutor** só é permitido sem alunos ativos.

## Onde está

| Peça | Arquivo |
| --- | --- |
| Actions | `src/features/instrutores/actions/` (`listar-instrutores.ts`, `salvar-instrutor.ts`, `alunos.ts`) |
| Situação dos alunos | `src/features/instrutores/alunos.ts` e `regras.ts` |
| Lista de instrutores | `/gerenciamento/instrutores` (`instrutores-lista.tsx`) |
| Instrutor, planos e alunos | `/gerenciamento/instrutores/[id]` (`instrutor-detalhe.tsx`, `planos-aula.tsx`, `alunos-lista.tsx`) |
| Mensagens prontas | `src/components/gerenciamento/instrutores/mensagens-aluno.ts` |
| Sidebar | Item "Instrutores" no grupo Clientes, com badge de alunos vencendo ou em aberto |
| Dashboard | Pendências "Aulas com mensalidade em aberto" e "Aulas vencendo" |
| Detalhe do cliente | Aba "Aulas" no consumo; mensalidade em aberto entra no "Em aberto" e na mensagem de cobrança |

## Mensagens prontas

Saudação: "Olá, Ana! Aqui é da Arena JR, sobre suas aulas com Prof. Bruno." Os modelos aparecem só quando fazem sentido:

| Modelo | Quando aparece |
| --- | --- |
| Boas-vindas | Até 7 dias depois da matrícula |
| Cobrar mensalidade em aberto | Tem mensalidade sem pagamento |
| Avisar vencimento | Em dia, vence em até 7 dias |
| Mensalidade vencida | Vencido |
| Confirmar pagamento | Pagamento registrado nos últimos 3 dias e nada em aberto |
| Aula cancelada ou remarcada | Aluno ativo (texto com lacunas para completar no WhatsApp) |
| Outra mensagem | Sempre |

## Próximas fases

- **Fase 2:** login do instrutor (vê só os próprios alunos), mensalidade como item de comanda, horário fixo da turma gerando `Bloqueio`.
- **Fase 3:** cobrança automática (Pix recorrente, ver `PAGAMENTOS.md` na pasta do projeto) e o aluno vendo a própria mensalidade no site.
