---
name: booking-ui
description: Use ao construir telas de agendamento e reserva de horário (seleção de data e horário, confirmação, minhas reservas e agenda do admin) em Next.js com Tailwind e shadcn/ui.
---

# UI de reserva de horário

Siga também `frontend-design-base` (tokens, estados, acessibilidade) e `catalog-ui` (listagem e detalhe). Meta: reservar em até 3 toques a partir da agenda, sem a pessoa ter dúvida se o horário é dela.

## Fluxo do cliente
1. Escolher o dia: faixa horizontal de datas (`snap-x`, próximos 14 a 30 dias) com dia da semana abreviado + número; hoje marcado como "Hoje". Um ícone de calendário abre o `Calendar` do shadcn para datas além da faixa. Dias fechados ficam desabilitados.
2. Escolher o horário: grade de slots (`grid grid-cols-3 sm:grid-cols-4 gap-2`), cada slot um botão com a hora de início ("19:00"). Se houver várias quadras, agrupe por quadra ou mostre um seletor de quadra acima.
3. Escolher duração (se houver mais de uma opção): `ToggleGroup` "1h · 1h30 · 2h" que só mostra durações possíveis a partir daquele início.
4. Confirmar: resumo em `Sheet` (mobile) ou painel lateral (desktop) com quadra, data por extenso ("sábado, 11 de out"), horário início–fim, preço total e regra de cancelamento. Botão "Confirmar reserva".
5. Sucesso: tela de confirmação com os dados, "Adicionar ao calendário" (.ics) e "Ver minhas reservas". Não só um toast.
- Se a pessoa não está logada, permita escolher o horário e peça login/cadastro só na confirmação, preservando a seleção (na URL ou em query params do callback).

## Estados de slot (sempre com texto ou ícone além da cor)
- Livre: `variant="outline"`, clicável.
- Selecionado: `bg-primary text-primary-foreground` + ícone de check, `aria-pressed="true"`.
- Ocupado: esmaecido, riscado ou com rótulo "Ocupado", `disabled`.
- Bloqueado/fechado: igual ao ocupado, com motivo no admin.
- Passado: escondido no dia de hoje (ou desabilitado).
- Pendente de pagamento (fase futura): estilo de aviso com relógio.
- Use `aria-label` completo: "19:00 às 20:00, livre, R$ 120".

## Dados e regras
- O servidor é a fonte da verdade. Calcule os slots disponíveis no servidor (funcionamento − reservas ativas − bloqueios − passado) e envie prontos para o cliente; a UI não reimplementa a regra de conflito.
- Ao confirmar, a Server Action valida tudo de novo. Se o horário foi tomado nesse meio tempo, mostre uma mensagem clara ("Esse horário acabou de ser reservado") e recarregue os slots, mantendo o dia selecionado.
- Não use update otimista para criar reserva; use estado pendente no botão. Otimista só para ações reversíveis (ex.: marcar presença no admin).
- Fuso: guarde em UTC, exiba sempre em `America/Sao_Paulo` com `date-fns-tz` ou `Intl` com `timeZone`. Nunca use o fuso do navegador para montar slots.
- Preço mostrado é o que será cobrado; recalcule ao mudar a duração.
- Atualize a agenda depois de mutações com `revalidatePath`/`revalidateTag`.

## Minhas reservas
- Abas "Próximas" e "Anteriores". Card com quadra, data, horário, valor e badge de status (Confirmada, Cancelada, Concluída, Não compareceu), cada status com cor semântica + texto.
- "Cancelar reserva" abre `AlertDialog` com a regra ("Cancelamento gratuito até 24 h antes"). Fora do prazo, o botão some e aparece o texto explicando como falar com o espaço.
- Estado vazio com botão "Reservar um horário".

## Agenda do admin
- Visão do dia: colunas = quadras, linhas = horários (grade estilo calendário, `grid` com `grid-template-columns` por quadra e scroll horizontal no mobile com a coluna de horas fixa via `sticky left-0`).
- Cada reserva é um bloco que ocupa as linhas da sua duração, com nome do cliente, telefone e badges de pago/presença. Linha vermelha marcando a hora atual.
- Clicar num espaço vazio abre "Nova reserva manual" (nome + telefone) já preenchida com quadra e horário; clicar numa reserva abre o detalhe com ações (marcar pago, não compareceu, cancelar).
- Navegação de dia (anterior, hoje, próximo) e seletor de data. Bloqueios aparecem hachurados com o motivo.
- Desktop é prioridade aqui, mas a lista do dia por quadra precisa funcionar no celular do dono.

## Checklist
- [ ] Do detalhe da quadra até "Confirmar" em até 3 toques
- [ ] Slots calculados no servidor, em America/Sao_Paulo
- [ ] Conflito na confirmação tratado com mensagem e recarga
- [ ] Todos os estados de slot distinguíveis sem cor
- [ ] Tela de sucesso com dados da reserva e próximo passo
- [ ] Cancelamento com confirmação e regra de prazo visível
