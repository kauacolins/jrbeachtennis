"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { filtrarPorBusca } from "@/lib/busca";
import { formatarDataLonga, formatarHora } from "@/lib/format";
import { removerBloqueio } from "@/features/bloqueios/actions/remover-bloqueio";
import type { BloqueioFuturo } from "@/features/bloqueios/actions/listar-bloqueios";

export function BloqueioLista({
  bloqueiosIniciais,
}: {
  bloqueiosIniciais: BloqueioFuturo[];
}) {
  const [bloqueios, setBloqueios] = useState(bloqueiosIniciais);
  const [removendo, startTransition] = useTransition();
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(bloqueios, busca, (b) => [
    b.quadra.nome,
    b.motivo,
    formatarDataLonga(b.inicio),
  ]);

  function remover(id: string) {
    startTransition(async () => {
      const resultado = await removerBloqueio(id);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      setBloqueios((atual) => atual.filter((b) => b.id !== id));
      toast.success("Bloqueio removido.");
    });
  }

  if (bloqueios.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum bloqueio agendado.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <CampoBusca
        value={busca}
        onChange={setBusca}
        placeholder="Buscar por quadra, motivo ou data"
        ariaLabel="Buscar bloqueio"
      />
      {visiveis.length === 0 ? (
        <SemResultadoBusca busca={busca} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quadra</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead className="hidden sm:table-cell">Motivo</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((bloqueio) => (
              <TableRow key={bloqueio.id}>
                <TableCell className="font-medium">{bloqueio.quadra.nome}</TableCell>
                <TableCell className="whitespace-nowrap capitalize">{formatarDataLonga(bloqueio.inicio)}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatarHora(bloqueio.inicio)}–{formatarHora(bloqueio.fim)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {bloqueio.motivo || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={removendo}
                    onClick={() => remover(bloqueio.id)}
                    aria-label={`Remover bloqueio de ${bloqueio.quadra.nome}`}
                  >
                    <Trash2 className="text-destructive" aria-hidden />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
