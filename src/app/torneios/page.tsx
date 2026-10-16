import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarTorneiosPublicos } from "@/features/torneios/actions/listar-torneios-publicos";
import type { TorneioPublico } from "@/features/torneios/actions/listar-torneios-publicos";
import { formatarDataCurta } from "@/lib/format";
import { estaComInscricoesAbertas, infoStatusTorneioPublico } from "@/lib/torneio";

export const metadata: Metadata = {
  title: "Torneios | Arena JR",
};

// Card do torneio (skill catalog-ui): foto em proporção fixa com fallback,
// badge da situação sobre a foto, nome e data abaixo — o card inteiro é o
// link pra página do torneio. bannerUrl é um banner horizontal (mesma arte
// da home e do topo da página do torneio, aspect-[3/1]) — por isso o card
// usa aspect-[16/9] e só 2 colunas no desktop, em vez do 4/3 genérico de
// foto de produto, que cortava muito a lateral do banner.
function TorneioCard({ torneio, agora }: { torneio: TorneioPublico; agora: Date }) {
  const info = infoStatusTorneioPublico(torneio, agora);
  const aberto = estaComInscricoesAbertas(torneio, agora);

  return (
    <Link
      href={`/torneios/${torneio.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[16/9] w-full bg-muted">
        {torneio.bannerUrl ? (
          <Image
            src={torneio.bannerUrl}
            alt={torneio.nome}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Trophy className="size-10 text-muted-foreground" aria-hidden />
          </div>
        )}
        <Badge className={`absolute top-2 left-2 ${info.className}`}>{info.label}</Badge>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h2 className="line-clamp-2 font-medium">{torneio.nome}</h2>
        <p className="text-sm text-muted-foreground">
          {formatarDataCurta(torneio.dataInicio)} – {formatarDataCurta(torneio.dataFim)}
        </p>
        {aberto && (
          <p className="text-sm font-medium text-brand-text">
            Inscreva-se até {formatarDataCurta(torneio.inscricoesFecham)}
          </p>
        )}
        {torneio.descricao && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{torneio.descricao}</p>
        )}
      </div>
    </Link>
  );
}

function ListaTorneios({ torneios, agora }: { torneios: TorneioPublico[]; agora: Date }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {torneios.map((torneio) => (
        <li key={torneio.id}>
          <TorneioCard torneio={torneio} agora={agora} />
        </li>
      ))}
    </ul>
  );
}

export default async function TorneiosPage() {
  const torneios = await listarTorneiosPublicos();
  const agora = new Date();

  const emDestaque = torneios.filter((t) => t.dataFim >= agora);
  const encerrados = torneios
    .filter((t) => t.dataFim < agora)
    .sort((a, b) => b.dataInicio.getTime() - a.dataInicio.getTime());

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
        <Tabs defaultValue="destaque">
          <TabsList>
            <TabsTrigger value="destaque">Em destaque</TabsTrigger>
            <TabsTrigger value="encerrados">Encerrados</TabsTrigger>
          </TabsList>

          <TabsContent value="destaque" className="pt-4">
            {emDestaque.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhum torneio em aberto agora. Volte em breve.
              </p>
            ) : (
              <ListaTorneios torneios={emDestaque} agora={agora} />
            )}
          </TabsContent>

          <TabsContent value="encerrados" className="pt-4">
            {encerrados.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhum torneio encerrado ainda.
              </p>
            ) : (
              <ListaTorneios torneios={encerrados} agora={agora} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
