import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/get-session";
import { obterTorneioPublico } from "@/features/torneios/actions/obter-torneio-publico";
import { InscricaoForm } from "@/components/torneios/inscricao-form";

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

  const agora = new Date();
  const inscricoesAbertas =
    torneio.status === "INSCRICOES_ABERTAS" &&
    agora >= torneio.inscricoesAbrem &&
    agora < torneio.inscricoesFecham;
  const cheia = categoria.vagas !== null && categoria.inscricoes.length >= categoria.vagas;

  const usuario = sessao.user as typeof sessao.user & { telefone?: string | null };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Inscrição</h1>
        <p className="text-sm text-muted-foreground">
          {torneio.nome} · {categoria.nome}
        </p>
      </div>

      {!inscricoesAbertas || cheia ? (
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
