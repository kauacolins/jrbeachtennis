---
name: admin-panel-ui
description: Use ao construir ou revisar telas do painel interno de gestão da Arena JR (dashboard, agenda, reservas, comandas, day use, mensalistas, torneios, pagamentos) em Next.js com Tailwind e shadcn/ui.
---

# UI do painel de gestão (Arena JR)

Siga também `frontend-design-base` (tokens, estados, acessibilidade) e `booking-ui` (regras da agenda). Cores e tipografia vêm de `design/DESIGN-SYSTEM.md` e `design/paleta-arena-jr.css`; esta skill não cria cores novas.

Referência visual em `design/referencias-painel/`: `01-dashboard-tela-final.png` é a tela acabada que define o acabamento; `02-calendario-wireframe.png` e `03-reservas-wireframe.png` definem só a estrutura. A referência usa verde escuro; aqui ele vira o **preto Arena** e os destaques viram **limão**. Meta: o operador resolve qualquer tarefa do balcão em até 2 cliques, olhando a tela de relance.

## Tradução da referência para a marca
| Na referência | Na Arena JR |
|---|---|
| Sidebar verde escura | Sidebar que **segue o tema do site** pelos tokens `sidebar` (claro `#F8FAF6`, escuro `#0A0D10` preto Arena). Nunca force `className="dark"` (nem cor fixa como `bg-black`) no `<Sidebar>` ou num ancestral: ela ficaria escura no tema claro. Logo com par claro/escuro: `/logo.png` com `dark:hidden` e `/logo_branca.png` com `hidden dark:block` |
| Itens do menu com cantos arredondados | Cantos retos: `rounded-none` em `SidebarMenuButton` e `SidebarMenuSubButton`, aplicado no uso (não em `components/ui/sidebar.tsx`) |
| Item ativo com marca verde | Barra de 3 px à esquerda (`border-sidebar-primary`) + ícone `text-sidebar-primary`; fundo `sidebar-accent`. O token já resolve a cor certa: preto no claro, limão no escuro (limão sobre fundo claro não tem contraste) |
| Botão escuro "Quick Sale" na topbar | Botão `primary` (limão, texto preto) "Venda rápida". É o único limão da topbar |
| Botões cheios no rodapé dos widgets ("See all bookings", "Create Quick Sale") | `variant="secondary"` largura total; se for a ação principal da tela, `primary` |
| Blocos de estatística verde-claro | `bg-accent text-accent-foreground`, número grande em Archivo |
| Dia selecionado no calendário (quadrado verde) | `bg-primary text-primary-foreground`; dias com evento ganham um ponto `bg-foreground` embaixo |
| Barra colorida à esquerda do item da lista | `border-l-4` com a cor do status (pago `primary`, pendente `warning`, cancelado `muted`) |
| Badges pequenos Paid/Pending/Complete | `Badge` `text-[11px] rounded-full` com ícone: Pago e Concluída `accent`, Pendente `warning`, Cancelada `muted`. Status nunca em limão puro |
| Aviso de feriado com Accept/Decline | Faixa `bg-accent` com ação inline em `variant="ghost"` (ícone ✓ / ✕ + texto) |

## Shell
- Grupo `app/(admin)/painel/` com `layout.tsx` que checa o perfil Admin no servidor (RNF03).
- Sidebar (`SidebarProvider` do shadcn) com dois modos: aberta `w-64` (wireframe 03) e trilho de ícones `w-14` (tela 01), alternados pelo botão no topo e lembrados em cookie. No topo: logo Arena JR. Itens com subitens usam `Collapsible` com chevron.
- Menu agrupado com rótulos em `text-[11px] uppercase tracking-wide text-muted-foreground`:
  - **Principal:** Dashboard, Agenda, Reservas (Lista de reservas, quando existir), Comandas, Day use
  - **Clientes:** Clientes, Mensalistas
  - **Eventos:** Torneios
  - **Financeiro:** Pagamentos, Relatórios
  - **Configuração:** Quadras e horários (Quadras, Horários, Bloqueios), Produtos e preços, Produtos do bar, Equipe
- Seções com várias telas viram subitens `Collapsible` na própria sidebar. Não crie submenu lateral dentro da página (`layout.tsx` com nav ao lado do conteúdo).
- Padding padrão das telas (`px-4 py-6 md:px-6`) fica só no `app/gerenciamento/layout.tsx`, em volta do `children` dentro do `SidebarInset`. `page.tsx` e `loading.tsx` não repetem `px-*`/`py-*` no wrapper externo; só controlam `gap`, `max-w` etc.
- Cada tela do menu tem rota própria e só o item mais específico fica ativo. Não aninhe uma seção dentro da rota de outra (ex.: Clientes em `/gerenciamento/clientes`, não em `/equipe/clientes`).
- Badge de contagem só quando pede ação (comandas abertas, mensais vencendo, inscrições sem pagamento).
- Topbar `h-14 sticky top-0 border-b bg-background`: título da página em Archivo à esquerda; ao centro busca `Command` (Ctrl K) por cliente, comanda ou reserva; à direita "Venda rápida" (`primary`), "Nova reserva" (`outline`), alternador de tema (`ThemeToggle` de `@/components/theme-toggle`, o mesmo do site), ícones de configurações e notificações, e avatar com nome.
- Mobile: sidebar vira `Sheet`; Dashboard, Agenda, Comandas e Day use também numa barra inferior fixa.

## Dashboard (tela 01)
- Saudação "Bom dia, Kaua!" (`text-xl font-semibold`) e, à direita, seletor de data.
- Grade de widgets `grid gap-4 md:grid-cols-2 xl:grid-cols-3`, alturas fixas por linha, scroll interno quando passa.
- Anatomia do widget: `Card` com `border`, sem sombra, `p-4`. Cabeçalho: título `font-semibold` à esquerda; à direita ação "abrir" (↗, vai à tela completa). Abaixo, se houver, `Tabs` em linha (sublinhado limão no ativo) e uma fileira de filtros em `Select` pequenos (`h-8 text-xs`) + navegador de data "‹ qui, 27 mai 2025 › · Hoje". Corpo em lista. Rodapé com um botão de largura total.
- Widgets da Arena JR (equivalentes aos da referência):
  1. **Reservas** (Booking Log): abas Hoje · Aguardando pagamento; filtros quadra, modalidade, pagamento. Cada linha: nome do cliente, modalidade/quadra com ícone, data e horário, badge de pagamento; ações inline "Marcar pago" e "Cancelar". Rodapé "Ver todas as reservas".
  2. **Vendas rápidas** (Quick Sales): busca, filtro de status, data. Linha "Faturado hoje: R$ 295,00" e "Vendas: 5" em `text-xs`. Itens: nome da comanda, produtos resumidos (`truncate`), badge Paga/Aberta, horário relativo e total em negrito à direita. Rodapé "Nova venda rápida".
  3. **Calendário do mês** (Working Calendar): blocos de número em `accent` (Reservas no mês, Horas ocupadas, Day use, Mensalistas ativos); faixa de aviso para feriado ou bloqueio próximo; mini calendário mensal com ponto nos dias com torneio ou bloqueio.
  4. **Pendências** (Tasks): mensais vencendo, reservas de hoje não pagas, comandas abertas de ontem, inscrições sem pagamento; cada uma com ação direta e um `Switch` "Só de hoje".
  5. **Ocupação de hoje**: mini agenda horizontal por quadra com linha da hora atual.
- Primeira versão com widgets fixos; personalizar ("Adicionar widget", fechar, reordenar) fica para depois.

## Agenda (wireframe 02)
- Cabeçalho: "‹ 18 mai 2025 ›", botão Hoje, filtros `Select` Todas as quadras · Todos os tipos (Reserva, Day use, Torneio, Bloqueio) · Todos os status.
- Grade: coluna de horas fixa (`sticky left-0`) + uma coluna por quadra; linhas de 30 min com divisória fina `border-border/60`.
- Bloco de reserva: `bg-card border rounded-md p-2 text-xs`, ícone + tipo e cliente em negrito, horário embaixo, badge de status no canto. Bloqueio e torneio com hachura (`bg-[repeating-linear-gradient(...)]` usando `--muted`) e o motivo.
- Clicar num bloco abre **painel de detalhe fixo à direita** no desktop (`w-96 border-l`, não sobrepõe a grade) e `Sheet` no mobile. Conteúdo: tipo e título, data e horário, descrição, Quadra, Responsável, "Pagamentos e pessoas" (lista de nomes com telefone e valor), e no fim Total e Valor pago em `tabular-nums`, com ações Marcar pago, Adicionar à comanda, Cancelar.
- Clicar em espaço vazio abre "Nova reserva manual" já com quadra e horário.

## Lista de reservas (wireframe 03)
- `Tabs` Reservas · Pendentes de pagamento; fileira de filtros: busca, Tipo, Status, Canal (Site, Balcão, WhatsApp), Pagamento, Período.
- Visualização padrão em **grade de cards** `grid gap-3 sm:grid-cols-2 xl:grid-cols-4`, com alternância para tabela (`ToggleGroup` grade/lista, guardada na URL). Card: data e horário no topo (`text-xs text-muted-foreground`), título com ícone do tipo, código curto (`font-mono text-xs`, ex. RES-0021), e três linhas rótulo/valor: Canal, Pagamento (Pago, Parcial, Pendente), Status.
- Clicar no card abre o mesmo painel de detalhe da agenda.

## Outras telas (mesmos padrões)
- **Comandas** (`docs/CONSUMO.md`): cards das comandas abertas (nome grande, hora, total parcial). Comanda aberta: produtos em botões grandes à esquerda (mais vendidos primeiro), itens com tipo (Bar, Day use, Reserva) e total à direita; "Fechar e receber" escolhe o método e marca tudo pago.
- **Day use:** lista do dia com check-in em um toque, contador presentes/limite em bloco `accent`, marca "Mensal" quando o passe saiu por R$ 0.
- **Mensalistas:** tabela com vencimento e dias restantes; Ativo `accent`, Vence em até 7 dias `warning`, Vencido `destructive`.
- **Torneios** (`docs/CAMPEONATOS.md`): status Rascunho, Inscrições abertas, Em andamento, Encerrado; abas Dados, Banner e destaque na home (preview 1920x640), Categorias, Inscritos, Quadras bloqueadas.
- **Pagamentos** (`docs/PAGAMENTOS.md`): tabela com origem, método, status do gateway e link para o item pago; totais por método no topo.

## Regras gerais
- Densidade de painel: `text-sm` no corpo, `text-xs` em metadados, linhas de lista `py-2.5`, `gap-4` entre widgets. Archivo só em títulos de página e números grandes; o resto em Manrope. Valores e horários com `tabular-nums`.
- Filtros, abas, data e modo de visualização sempre em `searchParams`.
- Destrutivo (cancelar, estornar, excluir) em `AlertDialog`; ações rápidas reversíveis (pago, presença) com update otimista e toast "Desfazer".
- Moeda BRL com `Intl.NumberFormat('pt-BR')`, datas em `America/Sao_Paulo`, valores em centavos no banco.
- Os quatro estados da `frontend-design-base` em cada widget, não só na página: Skeleton no formato da lista, vazio com ação ("Nenhuma reserva aguardando pagamento").
- Telas do dia (dashboard, agenda, comandas, day use) revalidam após cada ação e a cada 30–60 s com a aba em foco, mostrando "Atualizado às 19:42".

## Checklist
- [ ] Rota protegida no servidor
- [ ] Sidebar acompanha o tema (troque claro/escuro e confira fundo, texto, item ativo e logo); só tokens `sidebar-*`, sem `dark` forçado; aberta, em trilho e no `Sheet` mobile funcionando
- [ ] Um só botão `primary` por área; status em `accent`/`warning`/`muted`, nunca limão
- [ ] Widgets com cabeçalho, filtros, lista e rodapé no mesmo padrão
- [ ] Agenda com painel de detalhe à direita sem cobrir a grade
- [ ] Filtros na URL; tabelas e grades viram lista no mobile
- [ ] Compare com `design/referencias-painel/01-dashboard-tela-final.png` e tire screenshot em 1440 px e 375 px
