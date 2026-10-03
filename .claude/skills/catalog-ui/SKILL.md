---
name: catalog-ui
description: Use ao construir telas de catálogo (listagem, filtros, busca, cards e página de detalhe) de quadras, serviços ou produtos em Next.js com Tailwind e shadcn/ui.
---

# UI de catálogo

Siga também a skill `frontend-design-base` para tokens, estados e acessibilidade. Esta skill cobre o que é específico de catálogo: ajudar a pessoa a achar o item certo rápido e seguir para a ação (reservar, comprar).

## Estrutura de páginas (App Router)
- `/quadras` (listagem): Server Component que busca com Prisma direto, filtrando por `searchParams`.
- `/quadras/[id]` (detalhe): `generateMetadata` com nome, foto e preço para compartilhar no WhatsApp (Open Graph).
- `loading.tsx` com grade de Skeletons no formato dos cards; `not-found.tsx` para item inexistente ou inativo.

## Filtros e busca
- Estado dos filtros na URL (`?modalidade=beach-tennis&q=areia`), não em useState. Assim o link é compartilhável e o botão voltar funciona. Use `nuqs` ou `useSearchParams` + `router.replace`.
- Poucas categorias (até ~6, ex.: modalidades): chips roláveis no topo (`ToggleGroup` ou botões `rounded-full`), com "Todas" primeiro e contagem opcional.
- Muitos filtros: botão "Filtros" que abre `Sheet` no mobile e sidebar fixa no desktop (`lg:grid-cols-[240px_1fr]`). Mostre os filtros ativos como badges removíveis e um "Limpar filtros".
- Busca com debounce de ~300 ms; não recarregue a página inteira a cada tecla.
- Ordenação simples (preço, nome, mais reservadas) num `Select` discreto.

## Card do item
Hierarquia fixa, de cima para baixo:
1. Foto em `next/image` com proporção fixa (`aspect-[4/3]`, `object-cover`), `sizes` correto e placeholder; fallback com ícone da modalidade se não houver foto.
2. Badge da categoria (modalidade) sobre a foto ou acima do título.
3. Nome (`font-medium`, máx. 2 linhas com `line-clamp-2`).
4. Informação de decisão em uma linha: preço ("R$ 120/h") e um sinal de disponibilidade ("Livre hoje às 19h" ou "3 horários hoje").
5. Ação: o card inteiro é um link para o detalhe; um botão secundário só se houver ação direta ("Ver horários").
- Grade: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`. No mobile, lista de 1 coluna com cards completos; evite 2 colunas apertadas.
- Itens indisponíveis/inativos não aparecem para o cliente; no admin aparecem esmaecidos com badge "Inativa".

## Página de detalhe
- Topo: foto (ou galeria com scroll-snap), nome, modalidade, preço.
- Logo abaixo, a ação principal visível sem rolar no mobile. Em sistemas de reserva, a agenda do dia já aparece aqui (ver skill `booking-ui`).
- Depois: descrição, características em lista com ícones (piso, iluminação, coberta, vestiário), regras (cancelamento, duração) e localização.
- Botão de compartilhar (Web Share API com fallback de copiar link).

## Desempenho
- Paginação ou "carregar mais" a partir de ~24 itens; nunca carregue tudo.
- Imagens otimizadas (`next/image`), `priority` só na primeira dobra.
- Cache: `revalidate` ou `revalidateTag` ao editar o item no admin.

## Admin do catálogo
- Tabela (shadcn Data Table com TanStack Table) no desktop, lista de cards no mobile.
- Formulário de item em página própria ou `Sheet`, com Zod no cliente e no servidor, preview da foto, preço digitado em reais e salvo em centavos.
- Ativar/desativar com `Switch` e confirmação; nunca excluir item com histórico.

## Checklist
- [ ] Filtros e busca refletidos na URL
- [ ] Card mostra foto, categoria, nome, preço e disponibilidade
- [ ] Estado vazio específico do filtro ("Nenhuma quadra de vôlei") com ação de limpar
- [ ] Detalhe com ação principal acima da dobra no mobile
