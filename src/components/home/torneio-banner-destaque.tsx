import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listarTorneiosDestacados } from "@/features/torneios/actions/listar-torneios-destacados";

// Banner(s) do(s) torneio(s) em destaque, logo abaixo do hero (docs/TORNEIOS.md,
// "Banner na home"). O banner é vertical (4:5), então em vez de uma faixa
// larga vira uma fileira de pôsteres no mesmo padrão do "Escolha seu jogo":
// rolagem lateral no celular, grade no desktop. Some sozinho quando não há
// nenhum torneio destacado dentro do prazo.
export async function TorneioBannerDestaque() {
  const torneios = await listarTorneiosDestacados();
  if (torneios.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 sm:pt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Torneios em destaque
        </h2>
        <Link
          href="/torneios"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-text hover:underline"
        >
          Ver todos
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {torneios.map((torneio, indice) => (
          <Link
            key={torneio.id}
            href={`/torneios/${torneio.slug}`}
            className="group relative aspect-[4/5] w-64 shrink-0 snap-start overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-full"
          >
            <Image
              src={torneio.bannerUrl!}
              alt={torneio.nome}
              fill
              priority={indice === 0}
              sizes="(min-width: 1024px) 270px, (min-width: 640px) 33vw, 256px"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
