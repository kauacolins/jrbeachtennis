---
name: frontend-design-base
description: Use ao criar ou revisar qualquer tela, componente ou página em Next.js com Tailwind e shadcn/ui, para um visual coerente, acessível e mobile first.
---

# Fundamentos de design de frontend (Next.js + Tailwind + shadcn/ui)

Objetivo: telas com cara de produto pensado, não de template genérico. Antes de escrever código, decida a direção visual em 3 linhas (tom, cor de marca, densidade) e mantenha a mesma em todo o projeto.

## Stack padrão
- Next.js App Router + TypeScript. Server Components por padrão; `"use client"` só onde há interação.
- Tailwind CSS para estilo; shadcn/ui para componentes base (Button, Card, Dialog, Sheet, Tabs, Calendar, Badge, Skeleton, Sonner para toasts, Form com react-hook-form + Zod).
- Ícones: lucide-react. Fonte: `next/font` (ex.: Inter ou Geist para UI; uma fonte display opcional só em títulos).
- Se o projeto já tem outra lib de UI, siga a do projeto.

## Tokens antes de componentes
- Defina cores como variáveis CSS em `globals.css` (`--primary`, `--background`, `--muted`, `--destructive`, `--success`, `--warning`) e use as classes do shadcn (`bg-primary`, `text-muted-foreground`). Nunca cor hex solta no JSX.
- Uma cor de marca forte + neutros. Cores semânticas só para estado (livre, ocupado, erro, sucesso), nunca decoração.
- Escala de espaçamento do Tailwind em passos de 4/8 px (`gap-2`, `gap-4`, `p-4`, `p-6`). Raio único no projeto (`--radius`).
- Tipografia: no máximo 4 tamanhos por tela. Título `text-2xl font-semibold tracking-tight`, corpo `text-sm`/`text-base`, legenda `text-xs text-muted-foreground`.
- Suporte a dark mode via `next-themes` desde o início; teste as duas variações.

## Mobile first
- Escreva o layout para 375 px primeiro e só depois `sm:`, `md:`, `lg:`.
- Alvos de toque com no mínimo 44 px de altura (`h-11` em botões principais no mobile).
- Ação principal fixa no rodapé em telas de fluxo (`sticky bottom-0` com `pb-[env(safe-area-inset-bottom)]`).
- No mobile, use `Sheet` (gaveta de baixo) no lugar de `Dialog` para formulários e filtros.
- Nada de scroll horizontal da página; scroll horizontal só dentro de faixas intencionais (ex.: carrossel de datas) com `snap-x`.

## Estados obrigatórios
Toda tela que carrega dados tem os quatro estados desenhados:
1. Carregando: `Skeleton` com o mesmo formato do conteúdo final (use `loading.tsx` do App Router).
2. Vazio: ícone, uma frase do que aconteceu e uma ação ("Nenhuma quadra de vôlei. Ver todas").
3. Erro: mensagem humana + tentar de novo (`error.tsx`).
4. Sucesso: confirmação clara (toast curto para ações pequenas, tela própria para ações importantes).
- Botões de envio mostram estado pendente (`useFormStatus` / `useTransition`) e ficam desabilitados para evitar clique duplo.

## Acessibilidade
- Contraste AA (4.5:1 em texto). Estado nunca só por cor: junte ícone ou texto.
- Foco visível em tudo (`focus-visible:ring-2`). Navegação completa por teclado.
- `aria-label` em botões só de ícone; `aria-live="polite"` para mensagens que aparecem depois de ações.
- Respeite `prefers-reduced-motion`; animações curtas (150–250 ms), só para dar contexto.

## Texto da interface
- Português do Brasil, verbos diretos nos botões ("Reservar", "Cancelar reserva"), nunca "OK" ou "Enviar".
- Moeda com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`; datas com `Intl.DateTimeFormat('pt-BR')` ou date-fns com locale ptBR.

## Evite (cara de template)
- Gradientes roxos aleatórios, sombras pesadas em tudo, cards dentro de cards, emojis como ícones, textos lorem ipsum, hero gigante sem conteúdo útil.
- Mais de um botão primário por área. Hierarquia: primário (1), secundário/outline, ghost.

## Checklist antes de entregar
- [ ] Testado em 375 px e 1280 px, claro e escuro
- [ ] Quatro estados (carregando, vazio, erro, sucesso) existem
- [ ] Navegável por teclado, foco visível, contraste ok
- [ ] Sem cor ou espaçamento fora dos tokens
- [ ] Rode o app e tire screenshot das telas alteradas para conferir
