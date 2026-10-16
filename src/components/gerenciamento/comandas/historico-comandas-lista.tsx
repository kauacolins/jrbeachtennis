"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { filtrarPorBusca } from "@/lib/busca";
import { formatarHora, formatarPreco } from "@/lib/format";
import { rotuloMetodo } from "@/lib/pagamento";
import type { HistoricoComandas } from "@/features/comandas/actions/listar-comandas";

// RF35: comandas fechadas/canceladas do dia, com busca pelo nome.
export function HistoricoComandasLista({ comandas }: { comandas: HistoricoComandas["comandas"] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(comandas, busca, (c) => [c.nome]);

  if (comandas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        <Receipt className="size-6" aria-hidden />
        Nenhuma comanda fechada nesse dia.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <CampoBusca
        value={busca}
        onChange={setBusca}
        placeholder="Buscar comanda pelo nome"
        ariaLabel="Buscar comanda"
      />

      {visiveis.length === 0 ? (
        <SemResultadoBusca busca={busca} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comanda</TableHead>
              <TableHead>Fechada</TableHead>
              <TableHead className="hidden sm:table-cell">Itens</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() => router.push(`/gerenciamento/comandas/${c.id}`)}
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/gerenciamento/comandas/${c.id}`}
                    className="underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.nome}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {c.fechadaEm ? formatarHora(c.fechadaEm) : "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                  {c.qtdItens}
                </TableCell>
                <TableCell>
                  {c.status === "CANCELADA" ? (
                    <Badge className="bg-muted text-muted-foreground">Cancelada</Badge>
                  ) : (
                    <Badge className="bg-accent text-accent-foreground">{rotuloMetodo(c.metodo)}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap tabular-nums">
                  {formatarPreco(c.totalCentavos)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
