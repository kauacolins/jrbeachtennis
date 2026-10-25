"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";
import { Role, StatusComanda, TipoItemComanda } from "@/app/generated/prisma/enums";

export type TipoConsumo = "RESERVA" | "DAY_USE" | "MENSAL" | "BAR" | "TORNEIO";

export interface ConsumoCliente {
  id: string;
  tipo: TipoConsumo;
  titulo: string;
  detalhe: string | null;
  /** Instante usado pra ordenar e exibir (dia do passe às 12h, no caso do day use). */
  data: Date;
  /** Day use guarda o dia como "yyyy-MM-dd"; mostrado sem passar por fuso. */
  dataISO: string | null;
  valorCentavos: number;
  pago: boolean;
  cancelado: boolean;
  /** Rótulo de status além de pago/a pagar (ex.: "Não compareceu"). */
  status: string | null;
  comandaId: string | null;
}

// Gerenciamento > Clientes > detalhe: cadastro + tudo que o cliente
// consumiu na arena. Junta as fontes que não se falam direto:
// - reservas da conta (Reserva.userId);
// - day use e mensal do cadastro de balcão (Cliente), ligado pela conta ou
//   pelo mesmo telefone;
// - inscrições em torneio que ele fez (quem paga);
// - itens de bar das comandas onde entrou alguma reserva ou passe dele —
//   comanda é só pelo nome, então essa é a única ligação confiável.
export async function obterCliente(id: string) {
  if (!(await exigirAdmin())) return null;

  const usuario = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      telefone: true,
      role: true,
      removidoEm: true,
      createdAt: true,
    },
  });
  if (!usuario || usuario.removidoEm || usuario.role !== Role.CLIENT) return null;

  const telefone = usuario.telefone?.replace(/\D/g, "") || null;
  const cadastrosBalcao = await prisma.cliente.findMany({
    where: { OR: [{ userId: id }, ...(telefone ? [{ telefone }] : [])] },
    select: { id: true },
  });
  const clienteIds = cadastrosBalcao.map((c) => c.id);

  const [reservas, passes, assinaturas, inscricoes, comandas] = await Promise.all([
    prisma.reserva.findMany({
      where: { userId: id },
      select: {
        id: true,
        inicio: true,
        fim: true,
        valorCentavos: true,
        status: true,
        pago: true,
        quadra: { select: { nome: true } },
        modalidade: { select: { nome: true } },
        itemComanda: { select: { comandaId: true } },
      },
      orderBy: { inicio: "desc" },
    }),
    prisma.passeDayUse.findMany({
      where: { clienteId: { in: clienteIds } },
      select: {
        id: true,
        data: true,
        valorCentavos: true,
        pago: true,
        canceladoEm: true,
        assinaturaId: true,
        itemComanda: { select: { comandaId: true } },
      },
    }),
    prisma.assinatura.findMany({
      where: { clienteId: { in: clienteIds } },
      select: {
        id: true,
        inicio: true,
        fim: true,
        valorCentavos: true,
        pago: true,
        canceladaEm: true,
        produto: { select: { nome: true } },
      },
    }),
    prisma.inscricao.findMany({
      where: { criadaPorId: id },
      select: {
        id: true,
        valorCentavos: true,
        status: true,
        createdAt: true,
        nomeEquipe: true,
        categoria: { select: { nome: true, torneio: { select: { nome: true } } } },
      },
    }),
    prisma.comanda.findMany({
      where: {
        status: { not: StatusComanda.CANCELADA },
        itens: {
          some: {
            OR: [{ reserva: { userId: id } }, { passe: { clienteId: { in: clienteIds } } }],
          },
        },
      },
      select: {
        id: true,
        nome: true,
        status: true,
        itens: {
          where: { tipo: TipoItemComanda.BAR },
          select: {
            id: true,
            descricao: true,
            quantidade: true,
            precoUnitarioCentavos: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  const consumos: ConsumoCliente[] = [
    ...reservas.map((r) => ({
      id: `reserva-${r.id}`,
      tipo: "RESERVA" as const,
      titulo: `${r.modalidade.nome} · ${r.quadra.nome}`,
      detalhe: null,
      data: r.inicio,
      dataISO: null,
      valorCentavos: r.valorCentavos,
      pago: r.pago,
      cancelado: r.status === "CANCELADA",
      status: r.status === "NAO_COMPARECEU" ? "Não compareceu" : null,
      comandaId: r.itemComanda?.comandaId ?? null,
    })),
    ...passes.map((p) => ({
      id: `passe-${p.id}`,
      tipo: "DAY_USE" as const,
      titulo: "Day use",
      detalhe: p.assinaturaId ? "Coberto pelo mensal" : null,
      data: new Date(`${p.data}T12:00:00-03:00`),
      dataISO: p.data,
      valorCentavos: p.valorCentavos,
      pago: p.pago || p.valorCentavos === 0,
      cancelado: p.canceladoEm !== null,
      status: null,
      comandaId: p.itemComanda?.comandaId ?? null,
    })),
    ...assinaturas.map((a) => ({
      id: `assinatura-${a.id}`,
      tipo: "MENSAL" as const,
      titulo: a.produto.nome,
      detalhe: null,
      data: a.inicio,
      dataISO: null,
      valorCentavos: a.valorCentavos,
      pago: a.pago,
      cancelado: a.canceladaEm !== null,
      status: null,
      comandaId: null,
    })),
    ...inscricoes.map((i) => ({
      id: `inscricao-${i.id}`,
      tipo: "TORNEIO" as const,
      titulo: i.categoria.torneio.nome,
      detalhe: [i.categoria.nome, i.nomeEquipe].filter(Boolean).join(" · "),
      data: i.createdAt,
      dataISO: null,
      valorCentavos: i.valorCentavos,
      pago: i.status === "CONFIRMADA",
      cancelado: i.status === "CANCELADA",
      status: null,
      comandaId: null,
    })),
    ...comandas.flatMap((c) =>
      c.itens.map((item) => ({
        id: `item-${item.id}`,
        tipo: "BAR" as const,
        titulo: item.quantidade > 1 ? `${item.descricao} ×${item.quantidade}` : item.descricao,
        detalhe: `Comanda ${c.nome}`,
        data: item.createdAt,
        dataISO: null,
        valorCentavos: item.precoUnitarioCentavos * item.quantidade,
        pago: c.status === StatusComanda.FECHADA,
        cancelado: false,
        status: null,
        comandaId: c.id,
      }))
    ),
  ].sort((a, b) => b.data.getTime() - a.data.getTime());

  const validos = consumos.filter((c) => !c.cancelado);
  const agora = new Date();
  const proximaReserva =
    reservas
      .filter((r) => r.inicio > agora && (r.status === "CONFIRMADA" || r.status === "PENDENTE_PAGAMENTO"))
      .at(-1) ?? null;
  const mensalAtivo =
    assinaturas
      .filter((a) => a.pago && !a.canceladaEm && a.inicio <= agora && a.fim > agora)
      .sort((a, b) => b.fim.getTime() - a.fim.getTime())[0] ?? null;

  return {
    cliente: {
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      telefone: usuario.telefone,
      createdAt: usuario.createdAt,
    },
    consumos,
    resumo: {
      pagoCentavos: validos.filter((c) => c.pago).reduce((s, c) => s + c.valorCentavos, 0),
      emAbertoCentavos: validos.filter((c) => !c.pago).reduce((s, c) => s + c.valorCentavos, 0),
      reservas: reservas.filter((r) => r.status !== "CANCELADA").length,
      dayUses: passes.filter((p) => !p.canceladoEm).length,
    },
    emAberto: validos.filter((c) => !c.pago && c.valorCentavos > 0),
    proximaReserva: proximaReserva && {
      inicio: proximaReserva.inicio,
      fim: proximaReserva.fim,
      quadra: proximaReserva.quadra.nome,
      modalidade: proximaReserva.modalidade.nome,
    },
    mensalAtivoAte: mensalAtivo?.fim ?? null,
  };
}

export type ClienteDetalhe = NonNullable<Awaited<ReturnType<typeof obterCliente>>>;
