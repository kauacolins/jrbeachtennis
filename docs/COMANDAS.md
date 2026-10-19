# Balcão: comandas, day use e plano mensal

Complementa `docs/REQUISITOS.md` (RF17–RF21, RN10, RN11).

## Decidido (Kaua)

- **2026-10-11, versão simplificada:** o cliente pede, o operador pega o nome da pessoa e todos os pedidos ficam associados a esse nome. A `Comanda` guarda só o nome. Sem cadastro, sem celular, sem pulseira, sem ligação com conta.
- Paga **no mesmo dia**, sem fiado.
- O sistema serve para **contar o total consumido** por pessoa. Não divide conta e não cobra online.
- **2026-10-11:** a comanda também recebe **day use** e **reserva de quadra**, para a pessoa pagar tudo junto no final.
- **2026-10-11:** day use e mensal são vendidos **no balcão** pelo operador (o cliente não compra pelo site). O day use precisa identificar a pessoa (um passe por dia, R$ 0 com mensal), então usa um **cadastro simplificado** (`Cliente`: nome e sobrenome, telefone opcional), separado da comanda. **2026-10-11:** o telefone virou opcional (só ajuda a identificar) e o cadastro passou a pedir nome e sobrenome.
- **2026-10-13: venda avulsa.** Cliente de balcão que não vai abrir comanda (ex.: só uma água, vai embora na hora) recebe o pagamento direto na tela "Pedido", sem precisar de nome. Por baixo ainda é uma `Comanda` (nome fixo "Venda avulsa"), mas abre, lança os itens e fecha numa transação só — a regra 1 (nome único entre as abertas) não vale aqui, porque ela nunca fica de fato aberta para o operador ver.

Como funcionava antes: o consumo de cada pessoa era anotado num caderninho e depois passado para o caderno.

Ideias discutidas e deixadas para depois: comanda de grupo/mesa, pedido pelo celular via QR Code, pulseira numerada, plano mensal como item de comanda, cliente comprar day use pelo site (RF19), cliente ver o próprio plano no site (RF21).

## Padrões assumidos

- Quem lança e fecha comandas: **admin e operador** (`/gerenciamento`). Cadastro de produtos e preços (RF17, RF30): **só admin**.
- Sem controle de estoque: o sistema só registra o que foi vendido.
- Pagamento no local. O operador fecha a comanda e marca a forma: `PIX`, `DINHEIRO`, `CARTAO_DEBITO` ou `CARTAO_CREDITO` (enum `MetodoPagamento`).

## Fluxo (`/gerenciamento/comandas`)

1. O cliente pede. O operador digita o nome no painel:
   - se já existe comanda aberta com esse nome, ela aparece filtrada e o operador toca nela;
   - se não existe, toca em "Nova comanda" e ela é criada com o nome.
2. O operador toca nos produtos, numa grade de cards com foto, nome e preço, com filtro por categoria. Os mais vendidos dos últimos 30 dias vêm primeiro, e a ordem fica travada enquanto a comanda está na tela (o card não pula de lugar entre um toque e outro). Cada toque soma 1 e o número no canto do card mostra quantos já estão na comanda. O preço é congelado no lançamento.
3. Novos pedidos da mesma pessoa vão para a mesma comanda (passo 1 de novo).
4. No fim, o operador toca em "Receber e fechar", vê o total, escolhe a forma de pagamento e confirma.

### Tela "Pedido" (`/gerenciamento/comandas/pedido`)

Caminho alternativo, com o pedido primeiro e a pessoa depois (decidido em 2026-10-11):

1. O operador toca nos produtos da grade (a mesma da comanda). Cada toque soma 1 no pedido.
2. Toca em "Continuar" e confere o pedido e o total (dá para ajustar as quantidades no −/+). Depois toca em "Adicionar à comanda" e escolhe de quem é o pedido: digita o nome e toca numa aberta, ou abre uma nova com esse nome (mesma regra 1 do painel).
3. Todos os itens entram de uma vez, numa transação só. Se algum produto foi desativado no meio do caminho, nada é lançado (nem a comanda nova fica aberta).
4. O pedido é limpo para o próximo. O aviso de sucesso tem um atalho "Ver comanda".
5. **Venda avulsa:** em vez de digitar o nome, o operador toca em "Venda avulsa — recebe agora", escolhe a forma de pagamento e confirma. Abre, lança e fecha a comanda (nome "Venda avulsa") numa transação só; nada fica pendente para fechar depois.

O pedido fica só no navegador até ser lançado. Day use e reserva continuam sendo lançados dentro da comanda.

### Day use e reserva na comanda

- **Day use:** na comanda, o operador toca em "Day use". Abre a busca de cliente (por nome ou telefone, já preenchida com o nome da comanda); se não achar, faz o cadastro rápido com nome, sobrenome e, se a pessoa quiser, telefone. O sistema cria o passe do dia (`PasseDayUse`, com limite diário e mensal ativo) e adiciona um item com o preço do passe (R$ 0 se coberto pelo mensal, já marcado como pago).
- **Reserva:** na comanda, o operador toca em "Reserva de hoje" e escolhe uma reserva de hoje ainda não paga. O item leva o valor congelado da reserva. Reserva nova se cria na Agenda (RF14) e depois entra na comanda.
- Ao **fechar a comanda como paga**, o sistema marca como pagos, na mesma transação, o passe (com a forma de pagamento) e a reserva ligados aos itens.
- Remover o item de day use cancela o passe; remover o item de reserva só desliga a reserva da comanda (ela continua na agenda, como não paga).
- **Cancelar a comanda** faz o mesmo para todos os itens: passes cancelados, reservas desligadas.

### Plano mensal (`/gerenciamento/planos`)

- O operador busca ou cadastra o cliente, escolhe a forma de pagamento e confirma: o plano já entra pago, por 30 dias.
- **Renovar** antes de vencer começa no fim do plano atual (não perde dias).
- **Cancelar** encerra o plano vigente a partir de agora; passes já usados continuam valendo.
- Filtros: ativos, vencendo (até 7 dias) e vencidos.

## Cliente vê a própria comanda (proposta, aguardando o Kaua)

Pedido de 2026-10-19: o cliente quer acompanhar a própria comanda em tempo real. O Kaua pensou em associar por nome + celular.

### Por que não só nome + celular

- Nome sozinho não identifica (dois "João" na arena).
- Celular identifica bem e o `Cliente` já guarda `telefone` único, então ele entra **para ligar a comanda à pessoa**.
- Mas usar nome + celular **como senha** numa página pública deixa qualquer um que saiba o celular de alguém ver o consumo dela (o celular não é verificado e é fácil de descobrir). Por isso a chave de acesso é outra: um **link secreto da comanda**.

### Como fica

1. **Ligar a comanda ao cliente (opcional).** Ao abrir a comanda, o operador pode buscar o cliente por nome ou celular (a mesma busca do day use) ou cadastrar na hora (nome, sobrenome, celular opcional). Sem cliente, a comanda continua funcionando só com o nome, como hoje. Venda avulsa nunca tem cliente nem link.
2. **Link + QR Code.** Toda comanda nasce com um código secreto aleatório (`tokenAcesso`, 128 bits). A tela da comanda no painel mostra um QR Code; o cliente aponta a câmera e abre `/comanda/<código>`, sem login e sem app.
3. **Enviar por WhatsApp (sem custo).** Se a comanda tem cliente com celular, o botão "Enviar link" abre o WhatsApp do operador com a mensagem pronta (`wa.me/55<celular>?text=...`). Não usa API paga: o operador só aperta enviar.
4. **Cliente com conta.** Se o `Cliente` está ligado a uma conta (`userId`, pelo mesmo celular), a comanda aberta aparece também em "Minhas reservas" / perfil, sem precisar do link.
5. **Trocar o link.** Se o link foi parar com outra pessoa, o operador toca em "Gerar novo link" e o antigo para de funcionar.

### O que o cliente vê (`/comanda/<código>`)

- Nome da comanda, situação (aberta, paga, cancelada), itens (descrição, quantidade, valor), total e a hora da última atualização.
- Só leitura: o cliente não lança, não remove e não paga pelo site (continua pagando no balcão, sem cobrança online).
- Depois de paga ou cancelada, a página mostra o resumo até o fim do dia (America/Sao_Paulo); depois disso o link responde "comanda não encontrada".

### Tempo real

A página consulta `GET /api/comanda/<código>` a cada 5 segundos (sem cache) e para enquanto a aba está em segundo plano. Com o movimento de uma arena, isso é leve e funciona na Vercel sem servidor de WebSocket. Se um dia precisar de mais, troca-se a consulta por SSE sem mudar a tela.

### Modelo de dados

```prisma
model Comanda {
  // ...campos atuais
  clienteId   String?  // opcional; ligado pela busca de cliente
  cliente     Cliente? @relation(fields: [clienteId], references: [id])
  tokenAcesso String   @unique // aleatório, gerado ao abrir; trocado em "Gerar novo link"

  @@index([clienteId, status])
}

model Cliente {
  // ...campos atuais
  comandas Comanda[]
}
```

A migration preenche `tokenAcesso` das comandas que já existem (`gen_random_uuid()`). O token novo é gerado no servidor com `crypto.randomBytes(16).toString("base64url")`. A rota `/comanda` fica fora do `middleware.ts` (é pública); a segurança vem do código ser impossível de adivinhar.

### Requisitos novos

| ID | Requisito | Perfil | Prioridade |
| --- | --- | --- | --- |
| RF40 | Cliente acompanha a comanda pelo link/QR Code, só leitura, atualizando sozinha | Cliente | Essencial |
| RF41 | Ligar a comanda a um cliente (busca por nome ou celular, ou cadastro rápido) | Admin, Operador | Essencial |
| RF42 | Mostrar QR Code, enviar o link pelo WhatsApp e gerar novo link | Admin, Operador | Essencial |
| RF43 | Cliente logado vê a comanda aberta na conta dele, sem link | Cliente | Desejável |

## Regras

1. O nome é texto livre. Se já houver comanda aberta com o mesmo nome (sem diferenciar maiúsculas e espaços), o sistema não cria outra: o operador acrescenta algo que diferencie (sobrenome, apelido: "João Paulo", "João do vôlei").
2. Total = soma de (quantidade × preço unitário congelado) dos itens, recalculado a cada mudança.
3. Item lançado errado pode ser removido enquanto a comanda está ABERTA. Comanda FECHADA ou CANCELADA não muda.
4. Produto inativo não aparece para lançamento, mas mantém o histórico. Produto não é excluído, só desativado.
5. Dinheiro em centavos (`Int`), como no resto do sistema.
6. Comanda aberta de dia anterior aparece em destaque para o operador fechar.
7. Uma reserva ou um passe só pode estar em uma comanda, e não entra se já estiver pago.
8. Comanda vazia não fecha; se não houve consumo, o operador cancela.

## Requisitos funcionais

| ID | Requisito | Perfil | Prioridade |
| --- | --- | --- | --- |
| RF30 | CRUD de produtos do bar (nome, categoria, preço, foto, ativo) | Admin | Essencial |
| RF31 | Painel de comandas abertas com busca por nome e total parcial | Admin, Operador | Essencial |
| RF32 | Abrir comanda digitando só o nome, com aviso de nome repetido | Admin, Operador | Essencial |
| RF33 | Lançar e remover itens com poucos toques (mais vendidos no topo) | Admin, Operador | Essencial |
| RF34 | Fechar comanda, ver o total e marcar como paga com a forma | Admin, Operador | Essencial |
| RF35 | Histórico de comandas por dia, com o total vendido e por forma de pagamento | Admin, Operador | Desejável |
| RF36 | Adicionar day use à comanda (cria o passe do dia) | Admin, Operador | Essencial |
| RF37 | Adicionar à comanda uma reserva de hoje não paga | Admin, Operador | Essencial |
| RF38 | Ao pagar a comanda, marcar como pagos o passe e a reserva ligados | Admin, Operador | Essencial |
| RF39 | Venda avulsa: lançar, receber e fechar sem nome, numa ação só | Admin, Operador | Essencial |

## Telas

| Rota | O que tem |
| --- | --- |
| `/gerenciamento/comandas` | Comandas abertas, busca e "Nova comanda" |
| `/gerenciamento/comandas/pedido` | Monta o pedido na grade e lança numa comanda aberta ou nova |
| `/gerenciamento/comandas/[id]` | Lançar (bar, day use, reserva), consumo, receber e fechar |
| `/comanda/[token]` | Público: o cliente acompanha a comanda (RF40) — proposta |
| `/gerenciamento/comandas/historico` | Fechadas/canceladas do dia, total e por forma de pagamento |
| `/gerenciamento/day-use` | Lista de day use do dia, vagas restantes (RF18) |
| `/gerenciamento/planos` | Ativar, renovar e cancelar mensal (RF20) |
| `/gerenciamento/produtos` | Preço do day use e do mensal, limite diário, cardápio do bar (RF17, RF30) — só admin |

## Modelo de dados

Ver `prisma/schema.prisma` (seção "Balcão") e a migration `balcao_comandas_day_use`: `Cliente`, `Produto` (day use e mensal, criados na migration), `PasseDayUse`, `Assinatura`, `ProdutoBar`, `Comanda`, `ItemComanda`. As regras ficam em `src/features/comandas/regras.ts` e `src/features/day-use/regras.ts`.

`ItemComanda` tem `@unique` em `passeId` e `reservaId` (um passe ou uma reserva não entra em duas comandas) e uma `CHECK` (`item_tipo_ok`) que garante o campo certo por tipo:

```sql
ALTER TABLE "ItemComanda" ADD CONSTRAINT item_tipo_ok CHECK (
  (tipo = 'BAR'     AND "produtoId" IS NOT NULL AND "passeId" IS NULL AND "reservaId" IS NULL) OR
  (tipo = 'DAY_USE' AND "passeId"   IS NOT NULL AND "produtoId" IS NULL AND "reservaId" IS NULL) OR
  (tipo = 'RESERVA' AND "reservaId" IS NOT NULL AND "produtoId" IS NULL AND "passeId" IS NULL)
);
```

O limite diário do day use é respeitado mesmo com dois operadores lançando ao mesmo tempo: a transação trava a linha do `Produto` (`SELECT … FOR UPDATE`) antes de contar.

### Categorias dos produtos

As categorias do bar vêm das tabelas genéricas `SelectGroup` / `SelectOption`, no grupo `categoria_produto` (Bebida e Comida, criadas na migration `select_group_option`). O `ProdutoBar.categoria` guarda o nome da opção como texto, então desativar uma opção não mexe nos produtos que já a usam. O servidor só aceita categoria nova se ela for uma opção ativa do grupo.

### Fotos dos produtos

O projeto não tem serviço de armazenamento de arquivos, então a foto fica no próprio Postgres (`ProdutoBar.foto`). O navegador reduz a imagem escolhida para no máximo 512 px em WebP antes de enviar (uns 20–40 KB por foto), e o servidor recusa arquivo acima de 500 KB. A rota pública `/api/produtos-bar/[id]/foto` serve a imagem com cache longo; a URL leva a data da última troca (`?v=`), então foto nova invalida o cache sozinha. Se o cardápio crescer muito, dá para migrar para um storage (ex.: Vercel Blob) trocando só essa rota e o salvamento.

## Em aberto

- [ ] Controle de estoque (padrão: não)
- [ ] Cliente ver o próprio plano no site (RF21): o `Cliente` já se liga à conta pelo telefone, falta a tela
