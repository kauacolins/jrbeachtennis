import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { resumirMensalidades } from "./regras";

// Consulta compartilhada pelas actions (lista do instrutor, dashboard,
// sidebar): alunos com a situação já calculada. Só roda no servidor.
export async function carregarAlunos(where: Prisma.AlunoWhereInput, agora = new Date()) {
  const alunos = await prisma.aluno.findMany({
    where,
    select: {
      id: true,
      instrutorId: true,
      horario: true,
      observacao: true,
      ativo: true,
      createdAt: true,
      cliente: { select: { id: true, nome: true, telefone: true, userId: true } },
      planoAula: { select: { id: true, nome: true, precoCentavos: true, duracaoDias: true } },
      mensalidades: {
        select: { inicio: true, fim: true, valorCentavos: true, pago: true, pagoEm: true, metodo: true, canceladaEm: true },
      },
    },
    orderBy: { cliente: { nome: "asc" } },
  });

  return alunos.map(({ mensalidades, ...aluno }) => ({
    ...aluno,
    ...resumirMensalidades(mensalidades, agora),
  }));
}
