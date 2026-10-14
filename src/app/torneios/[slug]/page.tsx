import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { obterTorneioPublico } from "@/features/torneios/actions/obter-torneio-publico";
import type { CategoriaPublica } from "@/features/torneios/actions/obter-torneio-publico";
import { formatarDataCurta, formatarPreco } from "@/lib/format";
import { rotuloStatusTorneio } from "@/lib/torneio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const torneio = await obterTorneioPublico(slug);
  if (!torneio) return {};
  return {
    title: `${torneio.nome} | Arena JR`,
    description: torneio.descricao ?? undefined,
    openGraph: torneio.bannerUrl ? { images: [torneio.bannerUrl] } : undefined,
  };
}

export default async function TorneioPublicoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const torneio = await obterTorneioPublico(slug);
  if (!torneio) notFound();

  const agora = new Date();
  const inscricoesAbertas =
    torneio.status === "INSCRICOES_ABERTAS" &&
    agora >= torneio.inscricoesAbrem &&
    agora < torneio.inscricoesFecham;

  const categoriasPorModalidade = new Map<string, CategoriaPublica[]>();
  for (const categoria of torneio.categorias) {
    const lista = categoriasPorModalidade.get(categoria.modalidade.nome) ?? [];
    lista.push(categoria);
    categoriasPorModalidade.set(categoria.modalidade.nome, lista);
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {torneio.bannerUrl && (
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-muted">
          <Image
            src={torneio.bannerUrl}
            alt={torneio.nome}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{torneio.nome}</h1>
            <Badge variant={inscricoesAbertas ? "secondary" : "outline"}>
              {rotuloStatusTorneio(torneio.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatarDataCurta(torneio.dataInicio)} – {formatarDataCurta(torneio.dataFim)}
          </p>
          {torneio.doacao && (
            <p className="text-sm text-muted-foreground">Contribuição: {torneio.doacao}</p>
          )}
          {torneio.descricao && (
            <p className="text-sm whitespace-pre-wrap">{torneio.descricao}</p>
          )}
        </div>

        {torneio.categorias.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            As categorias ainda vão ser anunciadas.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {[...categoriasPorModalidade.entries()].map(([modalidade, categorias]) => (
              <div key={modalidade} className="flex flex-col gap-3">
                <h2 className="font-heading text-lg font-semibold">{modalidade}</h2>
                <ul className="flex flex-col gap-3">
                  {categorias.map((categoria) => {
                    const inscritos = categoria.inscricoes.length;
                    const cheia = categoria.vagas !== null && inscritos >= categoria.vagas;
                    const podeInscrever = inscricoesAbertas && !cheia;
                    return (
                      <li key={categoria.id} className="flex flex-col gap-2 rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{categoria.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatarPreco(categoria.valorCentavos)}
                              {categoria.vagas !== null &&
                                ` · ${Math.max(categoria.vagas - inscritos, 0)} vaga${
                                  categoria.vagas - inscritos === 1 ? "" : "s"
                                }`}
                            </p>
                          </div>
                          {podeInscrever ? (
                            <Button
                              size="sm"
                              render={<Link href={`/torneios/${torneio.slug}/inscrever/${categoria.id}`} />}
                            >
                              Inscrever-se
                            </Button>
                          ) : (
                            <Button size="sm" disabled>
                              {cheia ? "Sem vagas" : "Inscrições fechadas"}
                            </Button>
                          )}
                        </div>
                        {inscritos > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Inscritos:{" "}
                            {categoria.inscricoes
                              .map((i) => i.nomeEquipe || i.atletas.map((a) => a.nome).join(" / "))
                              .join(" · ")}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
