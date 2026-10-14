import Image from "next/image";
import Link from "next/link";
import { listarTorneiosDestacados } from "@/features/torneios/actions/listar-torneios-destacados";
import { TorneioCarrossel } from "@/components/home/torneio-carrossel";

// Banner do(s) torneio(s) em destaque, logo abaixo do hero (docs/TORNEIOS.md,
// "Banner na home"). Some sozinho quando não há nenhum torneio destacado
// dentro do prazo — por isso não tem título de seção fixo como as outras.
export async function TorneioBannerDestaque() {
  const torneios = await listarTorneiosDestacados();
  if (torneios.length === 0) return null;

  if (torneios.length === 1) {
    const torneio = torneios[0];
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href={`/torneios/${torneio.slug}`}
          className="relative block aspect-[3/1] w-full overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Image
            src={torneio.bannerUrl!}
            alt={torneio.nome}
            fill
            sizes="(min-width: 1280px) 1152px, 100vw"
            className="object-cover"
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <TorneioCarrossel torneios={torneios} />
    </div>
  );
}
