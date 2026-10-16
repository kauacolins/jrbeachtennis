"use client";

import { useState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { filtrarPorBusca } from "@/lib/busca";
import { formatarHora, formatarPreco, formatarTelefone } from "@/lib/format";
import { rotuloMetodo } from "@/lib/pagamento";
import type { PassesDoDia } from "@/features/day-use/actions/listar-passes-dia";

// RF18: passes do dia, com busca por nome, telefone ou comanda.
export function DayUseLista({ passes }: { passes: PassesDoDia["passes"] }) {
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(passes, busca, (p) => [p.nome, p.telefone, p.comanda?.nome]);

  if (passes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        <Ticket className="size-6" aria-hidden />
        Nenhum day use nesse dia.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <CampoBusca
        value={busca}
        onChange={setBusca}
        placeholder="Buscar por nome, telefone ou comanda"
        ariaLabel="Buscar day use"
      />

      {visiveis.length === 0 ? (
        <SemResultadoBusca busca={busca} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Telefone</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead className="hidden md:table-cell">Comanda</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((passe) => (
              <TableRow key={passe.id} className={passe.cancelado ? "opacity-60" : undefined}>
                <TableCell className="font-medium">
                  <span className={passe.cancelado ? "line-through" : undefined}>{passe.nome}</span>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                  {passe.telefone ? formatarTelefone(passe.telefone) : "—"}
                </TableCell>
                <TableCell className="tabular-nums">{formatarHora(passe.entradaEm)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {passe.comanda ? (
                    <Link
                      href={`/gerenciamento/comandas/${passe.comanda.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {passe.comanda.nome}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {passe.cancelado ? (
                    <Badge className="bg-muted text-muted-foreground">Cancelado</Badge>
                  ) : passe.cobertoPeloPlano ? (
                    <Badge variant="secondary">Plano mensal</Badge>
                  ) : passe.pago ? (
                    <Badge className="bg-accent text-accent-foreground">
                      Pago · {rotuloMetodo(passe.metodo)}
                    </Badge>
                  ) : (
                    <Badge className="bg-warning text-warning-foreground">A pagar</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                  {formatarPreco(passe.valorCentavos)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
