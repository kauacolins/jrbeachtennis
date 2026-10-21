"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageIcon, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { filtrarPorBusca } from "@/lib/busca";
import { contagem, formatarDataCurta } from "@/lib/format";
import { rotuloStatusTorneio, variantePorStatusTorneio } from "@/lib/torneio";
import type { TorneioAdmin } from "@/features/torneios/actions/listar-torneios";

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
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum torneio cadastrado ainda.
        </p>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <span className="sr-only">Banner</span>
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Período</TableHead>
                  <TableHead className="hidden sm:table-cell">Categorias</TableHead>
                  <TableHead className="hidden sm:table-cell">Inscritos</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((torneio) => (
                  <TableRow
                    key={torneio.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/gerenciamento/torneios/${torneio.id}`)}
                  >
                    <TableCell className="py-2">
                      <div className="relative aspect-[4/5] w-8 shrink-0 overflow-hidden rounded-md bg-muted">
                        {torneio.bannerUrl ? (
                          <Image
                            src={torneio.bannerUrl}
                            alt={torneio.nome}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground/60">
                            <ImageIcon className="size-4" aria-hidden />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {torneio.nome}
                        {torneio.destaqueHome && (
                          <Star
                            className="size-3.5 shrink-0 fill-warning text-warning"
                            aria-hidden
                          />
                        )}
                        {torneio.destaqueHome && <span className="sr-only">(destaque na home)</span>}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatarDataCurta(torneio.dataInicio)} – {formatarDataCurta(torneio.dataFim)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {torneio._count.categorias}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {torneio.totalInscritos}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variantePorStatusTorneio(torneio.status)}>
                        {rotuloStatusTorneio(torneio.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/gerenciamento/torneios/${torneio.id}/edicao`);
                        }}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
