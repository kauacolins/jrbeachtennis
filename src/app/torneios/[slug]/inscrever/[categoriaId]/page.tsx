import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Ticket, Users } from "lucide-react";
import { getSessaoAtual } from "@/lib/get-session";
import { obterTorneioPublico } from "@/features/torneios/actions/obter-torneio-publico";
import { InscricaoForm } from "@/components/torneios/inscricao-form";
import { Badge } from "@/components/ui/badge";
import { formatarDataCurta, formatarPreco } from "@/lib/format";
import { estaComInscricoesAbertas } from "@/lib/torneio";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inscrição | Arena JR",
};

export default async function InscricaoPage({
  params,
}: {
  params: Promise<{ slug: string; categoriaId: string }>;
}) {
  const { slug, categoriaId } = await params;

  const sessao = await getSessaoAtual();
  if (!sessao?.user) {
    redirect(`/entrar?redirect=/torneios/${slug}/inscrever/${categoriaId}`);
  }

  const torneio = await obterTorneioPublico(slug);
  if (!torneio) notFound();
  const categoria = torneio.categorias.find((c) => c.id === categoriaId);
  if (!categoria) notFound();

  const inscricoesAbertas = estaComInscricoesAbertas(torneio);
  const inscritos = categoria.inscricoes.length;
  const restantes = categoria.vagas !== null ? categoria.vagas - inscritos : null;
  const cheia = restantes !== null && restantes <= 0;
  const poucasVagas = restantes !== null && restantes > 0 && restantes <= 3;
  const podeInscrever = inscricoesAbertas && !cheia;

  const usuario = sessao.user as typeof sessao.user & { telefone?: string | null };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`/torneios/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {torneio.nome}
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Inscrição</h1>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {categoria.modalidade.nome}
            </p>
            <p className="font-heading text-lg font-semibold">{categoria.nome}</p>
          </div>
          <p className="font-heading text-lg font-semibold">{formatarPreco(categoria.valorCentavos)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" aria-hidden />
            {categoria.maxAtletas > 1
              ? `${
                  categoria.minAtletas === categoria.maxAtletas
                    ? categoria.maxAtletas
                    : `${categoria.minAtletas}–${categoria.maxAtletas}`
                } atletas`
              : "Individual"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-4" aria-hidden />
            Inscrições até {formatarDataCurta(torneio.inscricoesFecham)}
          </span>
          {restantes !== null && (
            <Badge
              variant={cheia ? "destructive" : poucasVagas ? "outline" : "secondary"}
              className={cn(poucasVagas && !cheia && "border-warning text-warning")}
            >
              <Ticket aria-hidden />
              {cheia ? "Sem vagas" : `${restantes} vaga${restantes === 1 ? "" : "s"}`}
            </Badge>
          )}
        </div>
      </div>

      {!podeInscrever ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {cheia
            ? "Essa categoria está sem vagas."
            : "As inscrições desse torneio não estão abertas no momento."}
        </p>
      ) : (
        <InscricaoForm
          categoriaId={categoria.id}
          minAtletas={categoria.minAtletas}
          maxAtletas={categoria.maxAtletas}
          valorCentavos={categoria.valorCentavos}
          nomeUsuario={usuario.name}
          telefoneUsuario={usuario.telefone ?? ""}
        />
      )}
    </div>
  );
}
