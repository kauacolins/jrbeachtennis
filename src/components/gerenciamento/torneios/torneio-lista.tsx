"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { filtrarPorBusca } from "@/lib/busca";
import { formatarDataCurta } from "@/lib/format";
import { rotuloStatusTorneio } from "@/lib/torneio";
import type { TorneioAdmin } from "@/features/torneios/actions/listar-torneios";

function variantePorStatus(status: TorneioAdmin["status"]) {
  if (status === "CANCELADO") return "destructive" as const;
  if (status === "RASCUNHO" || status === "INSCRICOES_ENCERRADAS") return "outline" as const;
  return "secondary" as const;
}

export function TorneioLista({ torneios }: { torneios: TorneioAdmin[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(torneios, busca, (t) => [t.nome, t.slug]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Torneios</h1>
        <Button size="sm" onClick={() => router.push("/gerenciamento/torneios/novo")}>
          <Plus aria-hidden />
          Novo torneio
        </Button>
      </div>

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
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Período</TableHead>
                  <TableHead className="hidden sm:table-cell">Categorias</TableHead>
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
                    <TableCell className="font-medium">{torneio.nome}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatarDataCurta(torneio.dataInicio)} – {formatarDataCurta(torneio.dataFim)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {torneio._count.categorias}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variantePorStatus(torneio.status)}>
                        {rotuloStatusTorneio(torneio.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/gerenciamento/torneios/${torneio.id}`);
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
