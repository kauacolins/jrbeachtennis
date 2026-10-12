"use server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/require-admin";

export interface ClienteBalcao {
  id: string;
  nome: string;
  telefone: string | null;
  // fim do mensal ativo, se houver — o operador já vê que o day use sai R$ 0
  planoAteISO: string | null;
}

// Busca por nome ou telefone no cadastro do balcão (Cliente). Usado no day
// use da comanda e na tela de planos.
export async function buscarClientes(termo: string): Promise<ClienteBalcao[]> {
  if (!(await exigirAdmin())) return [];

  const texto = termo.trim();
  if (texto.length < 2) return [];
  const digitos = texto.replace(/\D/g, "");

  const agora = new Date();
  const clientes = await prisma.cliente.findMany({
    where: {
      OR: [
        { nome: { contains: texto, mode: "insensitive" } },
        ...(digitos.length >= 4 ? [{ telefone: { contains: digitos } }] : []),
      ],
    },
    include: {
      assinaturas: {
        where: { pago: true, canceladaEm: null, inicio: { lte: agora }, fim: { gt: agora } },
        orderBy: { fim: "desc" },
        take: 1,
      },
    },
    orderBy: { nome: "asc" },
    take: 8,
  });

  return clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    planoAteISO: c.assinaturas[0]?.fim.toISOString() ?? null,
  }));
}
