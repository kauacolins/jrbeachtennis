import Image from "next/image";
import Link from "next/link";
import { listarModalidadesComResumo } from "@/features/modalidades/actions/listar-modalidades-resumo";
import { FOTO_POR_MODALIDADE } from "@/lib/mock-data";
import { formatarPreco } from "@/lib/format";

export async function SportCards() {
  const modalidades = await listarModalidadesComResumo();

  if (modalidades.length === 0) return null;

  return (
    <section id="modalidades" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <h2 className="mb-8 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        Escolha seu jogo
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {modalidades.map((modalidade) => {
          const foto = FOTO_POR_MODALIDADE[modalidade.nome.toLowerCase()];
          return (
            <Link
              key={modalidade.id}
              href={`/reservar/${modalidade.id}`}
              className="group relative aspect-[4/5] w-64 shrink-0 snap-start overflow-hidden rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-full"
            >
              {foto ? (
                <Image
                  src={foto}
                  alt={`Quadra de ${modalidade.nome} na Arena JR`}
                  fill
                  sizes="(min-width: 640px) 33vw, 256px"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4 text-brand-black-foreground">
                <h3 className="font-heading text-lg font-bold">
                  {modalidade.nome}
                </h3>
                <p className="text-sm text-brand-black-foreground/80 tabular-nums">
                  {modalidade.quadrasCount}{" "}
                  {modalidade.quadrasCount === 1 ? "quadra" : "quadras"} · a
                  partir de {formatarPreco(modalidade.precoDesdeCentavos)}/h
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
