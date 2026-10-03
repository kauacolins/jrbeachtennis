# Design System — Arena JR

Sistema de reserva de quadras (beach tennis, vôlei, futebol). Stack: Next.js + Tailwind CSS v4 + shadcn/ui.

- Tokens prontos: [`paleta-arena-jr.css`](./paleta-arena-jr.css)
- Prévia visual: https://claude.ai/artifact/JRy6GnzFLHpJJebrjKEfLR

---

## 1. Origem da marca

As cores vêm do logo **Arena JR Beach Tennis**:

| Cor | Hex | De onde vem |
|---|---|---|
| Limão bola | `#78D23A` | Bola de tênis e efeito do logo |
| Verde efeito | `#3F7D1F` | Sombra do efeito verde |
| Preto Arena | `#0D1014` | Lettering "ARENA JR" |
| Branco | `#FFFFFF` | Fundo do logo |

O anel colorido em volta do logo (rosa/laranja) é a borda de story do Instagram e **não faz parte** da paleta.

---

## 2. Tokens de cor (shadcn/ui)

Valores em hex para referência. No CSS eles estão em `oklch`, como o shadcn usa no Tailwind v4.

### Modo claro (`:root`)

| Token | Hex | Texto por cima | Contraste |
|---|---|---|---|
| `background` | `#FFFFFF` | `foreground` `#0D1014` | 19.1:1 |
| `card` / `popover` | `#FFFFFF` | `#0D1014` | 19.1:1 |
| `primary` | `#78D23A` | `primary-foreground` `#0D1014` | 10.1:1 |
| `secondary` | `#F1F5EC` | `secondary-foreground` `#1F2E15` | 13.0:1 |
| `muted` | `#F4F5F3` | `muted-foreground` `#596157` | 5.9:1 |
| `accent` | `#E4F7D4` | `accent-foreground` `#2F591D` | 7.2:1 |
| `destructive` | `#DC2626` | branco | 4.8:1 |
| `border` / `input` | `#E3E6E0` | — | — |
| `ring` | `#4A9323` | sobre branco | 3.8:1 |
| `brand-text` *(extra)* | `#3F7D1F` | sobre branco | 5.0:1 |
| `warning` *(extra)* | `#F59E0B` | `#0D1014` | 8.9:1 |
| `sidebar` | `#F8FAF6` | `#0D1014` | — |
| `sidebar-primary` | `#0D1014` | `#78D23A` | 10.1:1 |

### Modo escuro (`.dark`)

| Token | Hex | Texto por cima | Contraste |
|---|---|---|---|
| `background` | `#0D1014` | `foreground` `#F3F6F0` | 17.5:1 |
| `card` / `popover` | `#151A1F` | `#F3F6F0` | 16.1:1 |
| `primary` | `#8BDB4E` | `#0D1014` | 11.2:1 |
| `secondary` | `#1E252B` | `#F3F6F0` | 14.2:1 |
| `muted` | `#1E252B` | `#9BA59A` | 6.1:1 |
| `accent` | `#1C2E12` | `#C9EFA8` | 11.3:1 |
| `destructive` | `#F06A6E` | sobre o fundo | 6.4:1 |
| `border` | `#262E35` | — | — |
| `input` | `#2C353D` | — | — |
| `ring` | `#8BDB4E` | sobre o fundo | 11.2:1 |
| `brand-text` *(extra)* | `#8BDB4E` | sobre o fundo | 11.2:1 |
| `warning` *(extra)* | `#FBBF24` | `#0D1014` | 11.4:1 |
| `sidebar` | `#0A0D10` | `#F3F6F0` | — |
| `sidebar-primary` | `#8BDB4E` | `#0D1014` | 11.2:1 |

Todos os pares de texto passam no **WCAG AA** (≥ 4.5:1). O `ring` passa o mínimo de 3:1 para indicadores de foco.

### Cores de gráfico

| Token | Claro | Escuro |
|---|---|---|
| `chart-1` | `#78D23A` limão | `#8BDB4E` |
| `chart-2` | `#2F591D` verde escuro | `#C9EFA8` |
| `chart-3` | `#0EA5E9` céu | `#38BDF8` |
| `chart-4` | `#F59E0B` areia | `#FBBF24` |
| `chart-5` | `#596157` cinza | `#9BA59A` |

---

## 3. Regras de uso

1. **Limão é fundo, não texto.** Sobre branco ele dá só 1.9:1. Para link, ícone ou texto verde no modo claro use `text-brand-text`.
2. **Texto sobre limão é sempre preto** (`primary-foreground`). Nunca branco.
3. **Um botão `primary` por tela.** O limão marca a ação principal (ex.: "Confirmar reserva"). Ações de apoio usam `secondary` ou `outline`.
4. **O preto também é cor de marca.** O item ativo da barra lateral é preto com texto limão, como no logo.
5. **Neutros levemente esverdeados.** Não troque por cinza puro do Tailwind (`gray`, `zinc`): use os tokens `muted`, `border`, `secondary`.
6. **Semântica separada da marca.** Erro usa `destructive`, pendência usa `warning`. Não use o limão para indicar "sucesso" de status; para isso use `accent`.

---

## 4. Estados do horário (grade de reservas)

| Estado | Classes Tailwind |
|---|---|
| Livre | `bg-accent text-accent-foreground` |
| Selecionado | `bg-primary text-primary-foreground font-bold ring-2 ring-ring ring-offset-2` |
| Ocupado | `bg-muted text-muted-foreground line-through` |
| Pendente | `border border-warning` |

### Badges de reserva

| Status | Classes |
|---|---|
| Confirmada | `bg-accent text-accent-foreground` |
| Aguardando pagamento | `bg-warning text-warning-foreground` |
| Cancelada | `bg-muted text-muted-foreground` |

---

## 5. Tipografia (sugestão)

Usada na prévia; ajustável.

| Papel | Fonte | Onde |
|---|---|---|
| Display | **Archivo** expandida (`wdth` 112–125, peso 700–800) | Títulos, logo em texto. Lembra o lettering largo do logo |
| Texto | **Manrope** (400–700) | Corpo, botões, formulários |
| Dados | **IBM Plex Mono** | Códigos, valores técnicos |

Horários e preços usam `tabular-nums` para alinhar colunas.

Com `next/font/google`:

```ts
import { Archivo, Manrope } from "next/font/google";

export const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display" });
export const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
```

---

## 6. Forma

- Raio base: `--radius: 0.625rem` (padrão shadcn).
- Badges: `rounded-full`.
- Bordas finas (`border`) em vez de sombras; sombra só em popovers e diálogos.

---

## 7. Instalação

1. Inicialize o shadcn/ui no projeto Next.js (`npx shadcn@latest init`).
2. Abra `app/globals.css` e substitua os blocos `:root { … }` e `.dark { … }` pelo conteúdo de `paleta-arena-jr.css`.
3. Mantenha o bloco `@theme inline` do arquivo para habilitar `bg-warning`, `text-warning-foreground` e `text-brand-text`.
4. Modo escuro: classe `.dark` no `<html>` (por exemplo com `next-themes`).
