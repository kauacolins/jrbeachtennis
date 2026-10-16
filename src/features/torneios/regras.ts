import type { Prisma } from "@/app/generated/prisma/client";

// Regras de inscrição (docs/TORNEIOS.md) em funções que recebem a
// transação, sem checar sessão — quem checa permissão são as Server Actions
// em ./actions. Mesma separação de src/features/comandas/regras.ts.

type Tx = Prisma.TransactionClient;
type Resultado = { ok: true } | { ok: false; erro: string };

export type InscreverResultado = { ok: true; inscricaoId: string } | { ok: false; erro: string };

// Uma inscrição = um atleta, uma dupla ou um time, dependendo de
// minAtletas/maxAtletas da categoria. A trava na linha da Categoria
// (FOR UPDATE) serializa inscrições simultâneas, pra não furar a vaga —
// mesma ideia do limite diário do day use.
export async function inscrever(
  tx: Tx,
  {
    categoriaId,
    criadaPorId,
    nomeEquipe,
    atletas,
    agora,
  }: {
    categoriaId: string;
    criadaPorId: string;
    nomeEquipe?: string | null;
    atletas: { nome: string; celular: string; userId?: string | null }[];
    agora: Date;
  }
): Promise<InscreverResultado> {
  const [categoria] = await tx.$queryRaw<
    {
      id: string;
      torneioId: string;
      minAtletas: number;
      maxAtletas: number;
      valorCentavos: number;
      vagas: number | null;
    }[]
  >`SELECT "id", "torneioId", "minAtletas", "maxAtletas", "valorCentavos", "vagas"
    FROM "Categoria" WHERE "id" = ${categoriaId} FOR UPDATE`;
  if (!categoria) return { ok: false, erro: "Categoria não encontrada." };

  const torneio = await tx.torneio.findUnique({ where: { id: categoria.torneioId } });
  if (!torneio) return { ok: false, erro: "Torneio não encontrado." };
  if (torneio.status !== "INSCRICOES_ABERTAS") {
    return { ok: false, erro: "As inscrições desse torneio não estão abertas." };
  }
  if (agora < torneio.inscricoesAbrem || agora >= torneio.inscricoesFecham) {
    return { ok: false, erro: "Fora do período de inscrição." };
  }

  if (atletas.length < categoria.minAtletas || atletas.length > categoria.maxAtletas) {
    return {
      ok: false,
      erro:
        categoria.minAtletas === categoria.maxAtletas
          ? `Essa categoria precisa de ${categoria.minAtletas} atleta${categoria.minAtletas > 1 ? "s" : ""}.`
          : `Essa categoria precisa de ${categoria.minAtletas} a ${categoria.maxAtletas} atletas.`,
    };
  }

  const celulares = atletas.map((a) => a.celular);
  if (new Set(celulares).size !== celulares.length) {
    return { ok: false, erro: "Um celular apareceu duas vezes na mesma inscrição." };
  }

  if (categoria.vagas !== null) {
    const ocupadas = await tx.inscricao.count({
      where: { categoriaId, status: { in: ["PENDENTE", "CONFIRMADA"] } },
    });
    if (ocupadas >= categoria.vagas) {
      return { ok: false, erro: "Essa categoria está sem vagas." };
    }
  }

  // Regra: um atleta não entra duas vezes na mesma categoria (celular).
  const jaNaCategoria = await tx.atletaInscrito.findFirst({
    where: {
      celular: { in: celulares },
      inscricao: { categoriaId, status: { in: ["PENDENTE", "CONFIRMADA"] } },
    },
  });
  if (jaNaCategoria) {
    return { ok: false, erro: "Um dos atletas já está inscrito nessa categoria." };
  }

  // Limite de categorias por atleta no torneio, se configurado.
  if (torneio.maxCategoriasAtleta !== null) {
    for (const celular of celulares) {
      const quantidade = await tx.atletaInscrito.count({
        where: {
          celular,
          inscricao: {
            status: { in: ["PENDENTE", "CONFIRMADA"] },
            categoria: { torneioId: torneio.id },
          },
        },
      });
      if (quantidade >= torneio.maxCategoriasAtleta) {
        return {
          ok: false,
          erro: `Um dos atletas já está no limite de ${torneio.maxCategoriasAtleta} categorias nesse torneio.`,
        };
      }
    }
  }

  const inscricao = await tx.inscricao.create({
    data: {
      categoriaId,
      criadaPorId,
      nomeEquipe: nomeEquipe || null,
      valorCentavos: categoria.valorCentavos,
      atletas: {
        create: atletas.map((a) => ({ nome: a.nome, celular: a.celular, userId: a.userId || null })),
      },
    },
  });

  return { ok: true, inscricaoId: inscricao.id };
}

export async function cancelarInscricao(tx: Tx, inscricaoId: string): Promise<Resultado> {
  const inscricao = await tx.inscricao.findUnique({ where: { id: inscricaoId } });
  if (!inscricao) return { ok: false, erro: "Inscrição não encontrada." };
  if (inscricao.status === "CANCELADA") return { ok: true };

  await tx.inscricao.update({ where: { id: inscricaoId }, data: { status: "CANCELADA" } });
  return { ok: true };
}

// Cancelar o torneio cancela as inscrições e libera as quadras bloqueadas
// pra ele (docs/TORNEIOS.md, "Regras"). Chamado por salvarTorneio sempre
// que o status vira CANCELADO — idempotente, então salvar de novo um
// torneio já cancelado não faz nada a mais.
export async function cancelarTorneio(tx: Tx, torneioId: string): Promise<void> {
  await tx.inscricao.updateMany({
    where: { categoria: { torneioId }, status: { not: "CANCELADA" } },
    data: { status: "CANCELADA" },
  });
  await tx.bloqueio.deleteMany({ where: { torneioId } });
}

// Pagamento confirmado à mão pelo admin na primeira versão (ver
// docs/TORNEIOS.md, "Decidido").
export async function confirmarPagamentoInscricao(
  tx: Tx,
  inscricaoId: string,
  agora: Date
): Promise<Resultado> {
  const inscricao = await tx.inscricao.findUnique({ where: { id: inscricaoId } });
  if (!inscricao) return { ok: false, erro: "Inscrição não encontrada." };
  if (inscricao.status === "CANCELADA") return { ok: false, erro: "Essa inscrição foi cancelada." };

  await tx.inscricao.update({
    where: { id: inscricaoId },
    data: { status: "CONFIRMADA", pagoEm: agora },
  });
  return { ok: true };
}
