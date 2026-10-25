"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ImageIcon, Pencil, Plus, Star, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { filtrarPorBusca } from "@/lib/busca";
import { contagem, formatarDataCurta } from "@/lib/format";
import { rotuloStatusTorneio, variantePorStatusTorneio } from "@/lib/torneio";
import type { TorneioAdmin } from "@/features/torneios/actions/listar-torneios";

// Torneios em cards: banner 4:5 à esquerda, situação, período e números do
// torneio. O card inteiro abre a visão geral; "Editar" fica por cima do
// link (relative z-10) e vai direto pra edição.
export function TorneioLista({ torneios }: { torneios: TorneioAdmin[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(torneios, busca, (t) => [t.nome, t.slug]);

  return (
    <div className="flex flex-col gap-3">
      <CabecalhoLista
        titulo="Torneios"
        contagem={torneios.length > 0 ? contagem(torneios.length, "torneio cadastrado", "torneios cadastrados") : undefined}
        acao={
          <Button size="sm" onClick={() => router.push("/gerenciamento/torneios/novo")}>
            <Plus aria-hidden />
            Novo torneio
          </Button>
        }
      />

      {torneios.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <Trophy className="size-6" aria-hidden />
          Nenhum torneio cadastrado ainda.
        </div>
      ) : (
        <>
          <CampoBusca
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome ou slug"
            ariaLabel="Buscar torneio"
          />
          {visiveis.length === 0 ? (
            <SemResultadoBusca busca={busca} />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {visiveis.map((torneio) => (
                <li
                  key={torneio.id}
                  className="relative flex gap-3 rounded-xl border bg-card p-3 transition-colors focus-within:border-ring hover:border-foreground/30"
                >
                  <div className="relative aspect-[4/5] w-20 shrink-0 self-start overflow-hidden rounded-lg bg-muted sm:w-24">
                    {torneio.bannerUrl ? (
                      <Image
                        src={torneio.bannerUrl}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground/60">
                        <ImageIcon className="size-5" aria-hidden />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/gerenciamento/torneios/${torneio.id}`}
                        className="min-w-0 font-semibold leading-snug outline-none after:absolute after:inset-0 after:rounded-xl"
                      >
                        <span className="line-clamp-2">{torneio.nome}</span>
                      </Link>
                      <Badge variant={variantePorStatusTorneio(torneio.status)} className="shrink-0">
                        {rotuloStatusTorneio(torneio.status)}
                      </Badge>
                    </div>

                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                      <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                      {formatarDataCurta(torneio.dataInicio)} – {formatarDataCurta(torneio.dataFim)}
                      {torneio.destaqueHome && (
                        <span className="ml-1 inline-flex items-center gap-1">
                          <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-hidden />
                          Destaque na home
                        </span>
                      )}
                    </p>

                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-accent px-2.5 py-1.5 text-accent-foreground">
                        <dt className="text-[11px]">Categorias</dt>
                        <dd className="font-heading text-lg font-bold tabular-nums">{torneio._count.categorias}</dd>
                      </div>
                      <div className="rounded-lg bg-accent px-2.5 py-1.5 text-accent-foreground">
                        <dt className="text-[11px]">Inscritos</dt>
                        <dd className="font-heading text-lg font-bold tabular-nums">{torneio.totalInscritos}</dd>
                      </div>
                    </dl>

                    <Button
                      variant="outline"
                      size="lg"
                      className="relative z-10 mt-auto w-full"
                      nativeButton={false}
                      render={<Link href={`/gerenciamento/torneios/${torneio.id}/edicao`} />}
                    >
                      <Pencil aria-hidden />
                      Editar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
