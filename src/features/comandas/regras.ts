import type { Prisma } from "@/app/generated/prisma/client";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";
import { formatarHora } from "@/lib/format";
import { normalizarNomeComanda } from "@/lib/comanda";
import { criarPasseDayUse } from "@/features/day-use/regras";

// Regras da comanda (docs/COMANDAS.md) em funções que recebem a transação,
// sem checar sessão — quem checa permissão são as Server Actions em
// ./actions. Separado assim pra dar pra exercitar as regras direto no banco.

type Tx = Prisma.TransactionClient;
type Resultado = { ok: true } | { ok: false; erro: string };

async function comandaAberta(tx: Tx, comandaId: string) {
  // Trava a linha: dois operadores lançando na mesma comanda não perdem o total.
  const [comanda] = await tx.$queryRaw<{ id: string; status: string }[]>`
    SELECT "id", "status" FROM "Comanda" WHERE "id" = ${comandaId} FOR UPDATE`;
  if (!comanda) return { ok: false as const, erro: "Comanda não encontrada." };
  if (comanda.status !== "ABERTA") {
    return { ok: false as const, erro: "Essa comanda já foi fechada." };
  }
  return { ok: true as const };
}

// Regra 2: total = soma de quantidade × preço congelado. Soma e grava numa
// consulta só — toda ação de comanda termina aqui, e cada ida ao banco pesa
// dentro da transação (ver transactionOptions em lib/prisma).
async function recalcularTotal(tx: Tx, comandaId: string) {
  const [comanda] = await tx.$queryRaw<{ totalCentavos: number }[]>`
    UPDATE "Comanda"
    SET "totalCentavos" = COALESCE(
      (SELECT SUM("quantidade" * "precoUnitarioCentavos")
       FROM "ItemComanda" WHERE "comandaId" = ${comandaId}),
      0
    )
    WHERE "id" = ${comandaId}
    RETURNING "totalCentavos"`;
  return comanda.totalCentavos;
}

// Regra 1: o nome é livre, mas não pode repetir o de outra comanda aberta —
// o operador acrescenta algo que diferencie ("João do vôlei").
export async function abrirComanda(
  tx: Tx,
  nomeDigitado: string
): Promise<{ ok: true; comandaId: string } | { ok: false; erro: string; existenteId?: string }> {
  const nome = nomeDigitado.trim().replace(/\s+/g, " ");
  const abertas = await tx.comanda.findMany({
    where: { status: "ABERTA", nome: { equals: nome, mode: "insensitive" } },
    select: { id: true, nome: true },
  });
  const repetida = abertas.find((c) => normalizarNomeComanda(c.nome) === normalizarNomeComanda(nome));
  if (repetida) {
    return {
      ok: false,
      erro: `Já existe uma comanda aberta para "${repetida.nome}". Use ela ou acrescente um sobrenome ou apelido.`,
      existenteId: repetida.id,
    };
  }
  const comanda = await tx.comanda.create({ data: { nome } });
  return { ok: true, comandaId: comanda.id };
}

// Venda avulsa (balcão, sem comanda nomeada): abre, lança os itens e fecha
// tudo na mesma transação (ver vender-avulso.ts). Como fecha na hora, não
// passa pela regra 1 (nome único entre as abertas) — "Venda avulsa" pode
// repetir, cada registro já nasce e morre fechado.
export async function abrirVendaAvulsa(tx: Tx): Promise<{ comandaId: string }> {
  const comanda = await tx.comanda.create({ data: { nome: "Venda avulsa" } });
  return { comandaId: comanda.id };
}

// Toque no produto: soma 1 no item já lançado com o mesmo preço, ou cria um
// novo (preço congelado no lançamento).
export async function adicionarItemBar(
  tx: Tx,
  { comandaId, produtoId }: { comandaId: string; produtoId: string }
): Promise<Resultado> {
  return lancarItensBar(tx, { comandaId, itens: [{ produtoId, quantidade: 1 }] });
}

// Pedido montado antes de escolher a comanda (tela "Pedido"): lança vários
// produtos de uma vez. Valida todos antes de gravar qualquer um — o retorno
// { ok: false } não desfaz a transação, então nada pode ter sido escrito.
export async function lancarItensBar(
  tx: Tx,
  { comandaId, itens }: { comandaId: string; itens: { produtoId: string; quantidade: number }[] }
): Promise<Resultado> {
  const aberta = await comandaAberta(tx, comandaId);
  if (!aberta.ok) return aberta;

  const produtos = await tx.produtoBar.findMany({
    where: { id: { in: itens.map((i) => i.produtoId) }, ativo: true },
    select: { id: true, nome: true, precoCentavos: true },
  });
  const porId = new Map(produtos.map((p) => [p.id, p]));
  if (itens.some((i) => !porId.has(i.produtoId))) {
    return { ok: false, erro: "Produto não encontrado ou inativo." };
  }

  for (const { produtoId, quantidade } of itens) {
    const produto = porId.get(produtoId)!;
    const existente = await tx.itemComanda.findFirst({
      where: { comandaId, produtoId, precoUnitarioCentavos: produto.precoCentavos },
    });
    if (existente) {
      await tx.itemComanda.update({
        where: { id: existente.id },
        data: { quantidade: { increment: quantidade } },
      });
    } else {
      await tx.itemComanda.create({
        data: {
          comandaId,
          tipo: "BAR",
          descricao: produto.nome,
          produtoId,
          quantidade,
          precoUnitarioCentavos: produto.precoCentavos,
        },
      });
    }
  }
  await recalcularTotal(tx, comandaId);
  return { ok: true };
}

// "−" num item do bar: tira 1; chegando a zero, remove o item.
export async function diminuirItemBar(tx: Tx, itemId: string): Promise<Resultado> {
  const item = await tx.itemComanda.findUnique({ where: { id: itemId } });
  if (!item || item.tipo !== "BAR") return { ok: false, erro: "Item não encontrado." };

  const aberta = await comandaAberta(tx, item.comandaId);
  if (!aberta.ok) return aberta;

  if (item.quantidade > 1) {
    await tx.itemComanda.update({ where: { id: itemId }, data: { quantidade: { decrement: 1 } } });
  } else {
    await tx.itemComanda.delete({ where: { id: itemId } });
  }
  await recalcularTotal(tx, item.comandaId);
  return { ok: true };
}

// Regra 3 + docs/COMANDAS.md: remover day use cancela o passe; remover
// reserva só desliga ela da comanda (continua na agenda como não paga).
export async function removerItem(tx: Tx, itemId: string, agora: Date): Promise<Resultado> {
  const item = await tx.itemComanda.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false, erro: "Item não encontrado." };

  const aberta = await comandaAberta(tx, item.comandaId);
  if (!aberta.ok) return aberta;

  await tx.itemComanda.delete({ where: { id: itemId } });
  if (item.tipo === "DAY_USE" && item.passeId) {
    await tx.passeDayUse.update({
      where: { id: item.passeId },
      data: { canceladoEm: agora },
    });
  }
  await recalcularTotal(tx, item.comandaId);
  return { ok: true };
}

// RF36: cria o passe do dia (regras de day use) e o item com o preço dele —
// R$ 0 se o cliente tem mensal ativo.
export async function adicionarDayUse(
  tx: Tx,
  { comandaId, clienteId, dataISO, agora }: {
    comandaId: string;
    clienteId: string;
    dataISO: string;
    agora: Date;
  }
): Promise<{ ok: true; cobertoPeloPlano: boolean } | { ok: false; erro: string }> {
  const aberta = await comandaAberta(tx, comandaId);
  if (!aberta.ok) return aberta;

  const cliente = await tx.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) return { ok: false, erro: "Cliente não encontrado." };

  const resultado = await criarPasseDayUse(tx, { clienteId, dataISO, agora });
  if (!resultado.ok) return resultado;

  const { passe } = resultado;
  await tx.itemComanda.create({
    data: {
      comandaId,
      tipo: "DAY_USE",
      descricao: passe.cobertoPeloPlano
        ? `Day use · ${cliente.nome} (plano mensal)`
        : `Day use · ${cliente.nome}`,
      passeId: passe.id,
      precoUnitarioCentavos: passe.valorCentavos,
    },
  });
  await recalcularTotal(tx, comandaId);
  return { ok: true, cobertoPeloPlano: passe.cobertoPeloPlano };
}

// RF37 + regra 7: só reserva de hoje, ativa, não paga e fora de outra comanda.
export async function adicionarReserva(
  tx: Tx,
  { comandaId, reservaId, inicioDia, fimDia }: {
    comandaId: string;
    reservaId: string;
    inicioDia: Date;
    fimDia: Date;
  }
): Promise<Resultado> {
  const aberta = await comandaAberta(tx, comandaId);
  if (!aberta.ok) return aberta;

  const reserva = await tx.reserva.findUnique({
    where: { id: reservaId },
    include: { quadra: true, itemComanda: true },
  });
  if (!reserva || reserva.status === "CANCELADA") {
    return { ok: false, erro: "Reserva não encontrada ou cancelada." };
  }
  if (reserva.inicio < inicioDia || reserva.inicio >= fimDia) {
    return { ok: false, erro: "Só dá para adicionar reservas de hoje." };
  }
  if (reserva.pago) return { ok: false, erro: "Essa reserva já está paga." };
  if (reserva.itemComanda) return { ok: false, erro: "Essa reserva já está em outra comanda." };

  await tx.itemComanda.create({
    data: {
      comandaId,
      tipo: "RESERVA",
      descricao: `${reserva.quadra.nome} · ${formatarHora(reserva.inicio)}–${formatarHora(reserva.fim)}`,
      reservaId,
      precoUnitarioCentavos: reserva.valorCentavos,
    },
  });
  await recalcularTotal(tx, comandaId);
  return { ok: true };
}

// RF34 + RF38: fecha como paga e, na mesma transação, marca como pagos o
// passe e a reserva ligados aos itens.
export async function fecharComanda(
  tx: Tx,
  { comandaId, metodo, agora }: { comandaId: string; metodo: MetodoPagamento; agora: Date }
): Promise<{ ok: true; totalCentavos: number } | { ok: false; erro: string }> {
  const aberta = await comandaAberta(tx, comandaId);
  if (!aberta.ok) return aberta;

  const itens = await tx.itemComanda.findMany({ where: { comandaId } });
  if (itens.length === 0) {
    return { ok: false, erro: "A comanda está vazia. Lance um item ou cancele a comanda." };
  }

  const totalCentavos = await recalcularTotal(tx, comandaId);

  const passeIds = itens.flatMap((i) => (i.passeId ? [i.passeId] : []));
  const reservaIds = itens.flatMap((i) => (i.reservaId ? [i.reservaId] : []));

  if (passeIds.length > 0) {
    // Passe coberto pelo mensal já nasce pago; só atualiza os que faltam.
    await tx.passeDayUse.updateMany({
      where: { id: { in: passeIds }, pago: false },
      data: { pago: true, metodo, pagoEm: agora },
    });
  }
  if (reservaIds.length > 0) {
    await tx.reserva.updateMany({ where: { id: { in: reservaIds } }, data: { pago: true } });
  }

  await tx.comanda.update({
    where: { id: comandaId },
    data: { status: "FECHADA", metodo, fechadaEm: agora, totalCentavos },
  });
  return { ok: true, totalCentavos };
}

// Cancelar a comanda inteira segue a mesma lógica de remover cada item:
// passes cancelados, reservas desligadas (voltam a "a pagar" na agenda).
export async function cancelarComanda(tx: Tx, comandaId: string, agora: Date): Promise<Resultado> {
  const aberta = await comandaAberta(tx, comandaId);
  if (!aberta.ok) return aberta;

  const itens = await tx.itemComanda.findMany({ where: { comandaId } });
  const passeIds = itens.flatMap((i) => (i.passeId ? [i.passeId] : []));
  if (passeIds.length > 0) {
    await tx.passeDayUse.updateMany({
      where: { id: { in: passeIds } },
      data: { canceladoEm: agora },
    });
  }
  await tx.itemComanda.deleteMany({ where: { comandaId, tipo: "RESERVA" } });
  await recalcularTotal(tx, comandaId);
  await tx.comanda.update({
    where: { id: comandaId },
    data: { status: "CANCELADA", fechadaEm: agora },
  });
  return { ok: true };
}
