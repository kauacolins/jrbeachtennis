"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { formatarPreco, formatarTelefone } from "@/lib/format";
import { rotuloStatusInscricao } from "@/lib/torneio";
import { confirmarPagamentoInscricao } from "@/features/torneios/actions/confirmar-pagamento-inscricao";
import { cancelarInscricao } from "@/features/torneios/actions/cancelar-inscricao";
import type { TorneioDetalhe } from "@/features/torneios/actions/obter-torneio";
import type { InscricaoAdmin } from "@/features/torneios/actions/listar-inscritos";

function variantePorStatus(status: InscricaoAdmin["status"]) {
  if (status === "CONFIRMADA") return "secondary" as const;
  if (status === "CANCELADA") return "destructive" as const;
  return "outline" as const;
}

// Campo com aspas duplicadas e entre "" — formato CSV padrão, abre certo no
// Excel/Sheets mesmo com vírgula ou aspas no nome.
function campoCsv(valor: string | number) {
  return `"${String(valor).replace(/"/g, '""')}"`;
}

// Lista de inscritos do torneio (docs/TORNEIOS.md, tela "Inscritos"): só o
// admin vê celular e status — a versão pública (/torneios/[slug]) mostra
// só nome.
export function InscritosLista({
  torneio,
  inscricoes,
}: {
  torneio: TorneioDetalhe;
  inscricoes: InscricaoAdmin[];
}) {
  const router = useRouter();

  async function marcarPago(inscricaoId: string) {
    const resultado = await confirmarPagamentoInscricao(inscricaoId);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Pagamento confirmado.");
    router.refresh();
  }

  async function cancelar(inscricaoId: string) {
    const resultado = await cancelarInscricao(inscricaoId);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Inscrição cancelada.");
    router.refresh();
  }

  function exportarCsv() {
    const cabecalho = [
      "Categoria",
      "Equipe/atletas",
      "Celulares",
      "Valor",
      "Situação",
      "Pago em",
      "Inscrito por",
    ];
    const linhas = inscricoes.map((inscricao) =>
      [
        inscricao.categoria.nome,
        inscricao.nomeEquipe || inscricao.atletas.map((a) => a.nome).join(" / "),
        inscricao.atletas.map((a) => a.celular).join(" / "),
        (inscricao.valorCentavos / 100).toFixed(2),
        rotuloStatusInscricao(inscricao.status),
        inscricao.pagoEm ? inscricao.pagoEm.toISOString() : "",
        inscricao.criadaPor.name,
      ]
        .map(campoCsv)
        .join(",")
    );
    const csv = [cabecalho.map(campoCsv).join(","), ...linhas].join("\n");
    // ﻿: BOM, senão o Excel lê acento errado num CSV UTF-8.
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inscritos-${torneio.slug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" render={<Link href={`/gerenciamento/torneios/${torneio.id}`} />}>
          <ArrowLeft aria-hidden />
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="font-heading text-xl font-bold">Inscritos — {torneio.nome}</h1>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {inscricoes.length} {inscricoes.length === 1 ? "inscrição" : "inscrições"}
        </span>
        <Button variant="outline" size="sm" disabled={inscricoes.length === 0} onClick={exportarCsv}>
          <Download aria-hidden />
          Exportar CSV
        </Button>
      </div>

      {inscricoes.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma inscrição ainda.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Atletas</TableHead>
              <TableHead className="hidden sm:table-cell">Celular</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inscricoes.map((inscricao) => (
              <TableRow key={inscricao.id}>
                <TableCell className="font-medium">{inscricao.categoria.nome}</TableCell>
                <TableCell>
                  {inscricao.nomeEquipe && <p className="font-medium">{inscricao.nomeEquipe}</p>}
                  <p className="text-muted-foreground">
                    {inscricao.atletas.map((a) => a.nome).join(" · ")}
                  </p>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {inscricao.atletas.map((a) => formatarTelefone(a.celular)).join(", ")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatarPreco(inscricao.valorCentavos)}
                </TableCell>
                <TableCell>
                  <Badge variant={variantePorStatus(inscricao.status)}>
                    {rotuloStatusInscricao(inscricao.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {inscricao.status === "PENDENTE" && (
                      <Button variant="outline" size="sm" onClick={() => marcarPago(inscricao.id)}>
                        Marcar pago
                      </Button>
                    )}
                    {inscricao.status !== "CANCELADA" && (
                      <ConfirmarBotao
                        size="sm"
                        variant="destructive"
                        actionVariant="destructive"
                        label="Cancelar"
                        titulo="Cancelar essa inscrição?"
                        descricao="A vaga volta a ficar disponível na categoria."
                        textoConfirmar="Cancelar"
                        textoConfirmando="Cancelando…"
                        onConfirmar={() => cancelar(inscricao.id)}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
