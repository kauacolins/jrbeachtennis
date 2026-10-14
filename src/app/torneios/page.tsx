import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { listarTorneiosPublicos } from "@/features/torneios/actions/listar-torneios-publicos";
import type { TorneioPublico } from "@/features/torneios/actions/listar-torneios-publicos";
import { formatarDataCurta } from "@/lib/format";
import { rotuloStatusTorneio } from "@/lib/torneio";

export const metadata: Metadata = {
  title: "Torneios | Arena JR",
};

function variantePorStatus(status: TorneioPublico["status"]) {
  return status === "INSCRICOES_ENCERRADAS" ? ("outline" as const) : ("secondary" as const);
}

// Card do torneio (skill catalog-ui): foto em proporção fixa com fallback,
// badge da situação sobre a foto, nome e data abaixo — o card inteiro é o
// link pra página do torneio.
export default async function TorneiosPage() {
  const torneios = await listarTorneiosPublicos();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:py-8">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Torneios</h1>

      {torneios.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <Trophy className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Nenhum torneio no momento. Volte em breve.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {torneios.map((torneio) => (
            <li key={torneio.id}>
              <Link
                href={`/torneios/${torneio.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="relative aspect-[4/3] w-full bg-muted">
                  {torneio.bannerUrl ? (
                    <Image
                      src={torneio.bannerUrl}
                      alt={torneio.nome}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Trophy className="size-10 text-muted-foreground" aria-hidden />
                    </div>
                  )}
                  <Badge variant={variantePorStatus(torneio.status)} className="absolute top-2 left-2">
                    {rotuloStatusTorneio(torneio.status)}
                  </Badge>
                </div>
                <div className="flex flex-col gap-0.5 p-4">
                  <h2 className="line-clamp-2 font-medium">{torneio.nome}</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatarDataCurta(torneio.dataInicio)} – {formatarDataCurta(torneio.dataFim)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
