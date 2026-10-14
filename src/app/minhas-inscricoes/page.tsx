import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CancelarInscricaoBotao } from "@/components/torneios/cancelar-inscricao-botao";
import { getSessaoAtual } from "@/lib/get-session";
import { listarMinhasInscricoes } from "@/features/torneios/actions/listar-minhas-inscricoes";
import type { MinhaInscricao } from "@/features/torneios/actions/listar-minhas-inscricoes";
import { formatarDataCurta, formatarPreco } from "@/lib/format";
import { rotuloStatusInscricao } from "@/lib/torneio";

export const metadata: Metadata = {
  title: "Minhas inscrições | Arena JR",
};

function variantePorStatus(status: MinhaInscricao["status"]) {
  if (status === "CONFIRMADA") return "secondary" as const;
  if (status === "CANCELADA") return "destructive" as const;
  return "outline" as const;
}

export default async function MinhasInscricoesPage() {
  const sessao = await getSessaoAtual();
  if (!sessao?.user) {
    redirect("/entrar?redirect=/minhas-inscricoes");
  }

  const inscricoes = await listarMinhasInscricoes(sessao.user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Minhas inscrições</h1>

      {inscricoes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <Trophy className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Você ainda não se inscreveu em nenhum torneio.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {inscricoes.map((inscricao) => (
            <li key={inscricao.id} className="flex flex-col gap-2 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{inscricao.categoria.torneio.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {inscricao.categoria.nome} ·{" "}
                    {formatarDataCurta(inscricao.categoria.torneio.dataInicio)}
                  </p>
                </div>
                <Badge variant={variantePorStatus(inscricao.status)}>
                  {rotuloStatusInscricao(inscricao.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {inscricao.atletas.map((a) => a.nome).join(" · ")} ·{" "}
                {formatarPreco(inscricao.valorCentavos)}
              </p>
              {inscricao.status !== "CANCELADA" && (
                <CancelarInscricaoBotao inscricaoId={inscricao.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
