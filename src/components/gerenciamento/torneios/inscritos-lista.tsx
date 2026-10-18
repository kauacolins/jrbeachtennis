"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { formatarPreco, formatarTelefone } from "@/lib/format";
import { classeStatusInscricao, rotuloStatusInscricao } from "@/lib/torneio";
import { confirmarPagamentoInscricao } from "@/features/torneios/actions/confirmar-pagamento-inscricao";
import { cancelarInscricao } from "@/features/torneios/actions/cancelar-inscricao";
import { cn } from "@/lib/utils";
import type { TorneioDetalhe } from "@/features/torneios/actions/obter-torneio";
import type { InscricaoAdmin } from "@/features/torneios/actions/listar-inscritos";

// Campo com aspas duplicadas e entre "" — formato CSV padrão, abre certo no
// Excel/Sheets mesmo com vírgula ou aspas no nome.
function campoCsv(valor: string | number) {
  return `"${String(valor).replace(/"/g, '""')}"`;
}

// Lista de inscritos do torneio (docs/TORNEIOS.md, tela "Inscritos"): só o
// admin vê celular e status — a versão pública (/torneios/[slug]) mostra só
// nome. Agrupada por categoria (inclusive as sem inscrição ainda) pra servir
// de painel de organização do campeonato, não só uma tabela solta.
export function InscritosLista({
  torneio,
  inscricoes,
}: {
  torneio: TorneioDetalhe;
  inscricoes: InscricaoAdmin[];
}) {
  const router = useRouter();

  const grupos = useMemo(
    () =>
      torneio.categorias.map((categoria) => {
        const itens = inscricoes.filter((i) => i.categoria.id === categoria.id);
        const ativas = itens.filter((i) => i.status !== "CANCELADA");
        const restantes = categoria.vagas !== null ? categoria.vagas - ativas.length : null;
        const valorConfirmado = itens
          .filter((i) => i.status === "CONFIRMADA")
          .reduce((soma, i) => soma + i.valorCentavos, 0);
        return { categoria, itens, restantes, valorConfirmado };
      }),
    [torneio.categorias, inscricoes]
  );

  const pendentes = inscricoes.filter((i) => i.status === "PENDENTE").length;
  const valorTotalConfirmado = inscricoes
    .filter((i) => i.status === "CONFIRMADA")
    .reduce((soma, i) => soma + i.valorCentavos, 0);

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
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/gerenciamento/torneios/${torneio.id}`} />}>
          <ArrowLeft aria-hidden />
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="font-heading text-xl font-bold">Inscritos — {torneio.nome}</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Inscrições</p>
          <p className="font-heading text-lg font-semibold tabular-nums">{inscricoes.length}</p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          <p
            className={cn(
              "font-heading text-lg font-semibold tabular-nums",
              pendentes > 0 && "text-warning"
            )}
          >
            {pendentes}
          </p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground">Confirmado</p>
          <p className="font-heading text-lg font-semibold tabular-nums">
            {formatarPreco(valorTotalConfirmado)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" disabled={inscricoes.length === 0} onClick={exportarCsv}>
          <Download aria-hidden />
          Exportar CSV
        </Button>
      </div>

      {torneio.categorias.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma categoria cadastrada ainda.
        </p>
      ) : (
        <Accordion multiple defaultValue={torneio.categorias.map((c) => c.id)} className="gap-2">
          {grupos.map(({ categoria, itens, restantes, valorConfirmado }) => {
            const cheia = restantes !== null && restantes <= 0;
            return (
              <AccordionItem
                key={categoria.id}
                value={categoria.id}
                id={`categoria-${categoria.id}`}
                className="rounded-xl border px-3 not-last:border-b-0"
              >
                <AccordionTrigger className="px-1">
                  <span className="flex flex-1 flex-wrap items-center justify-between gap-2 pr-2">
                    <span className="font-semibold">{categoria.nome}</span>
                    <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                      {itens.length} inscri{itens.length === 1 ? "ção" : "ções"}
                      {restantes !== null && (
                        <Badge variant={cheia ? "destructive" : "outline"} className="h-5">
                          {cheia ? "Sem vagas" : `${Math.max(restantes, 0)} vaga${restantes === 1 ? "" : "s"}`}
                        </Badge>
                      )}
                      {valorConfirmado > 0 && <span>{formatarPreco(valorConfirmado)} confirmado</span>}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-1">
                  {itens.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">Nenhuma inscrição ainda.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Atletas</TableHead>
                            <TableHead className="hidden sm:table-cell">Celular</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Situação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itens.map((inscricao) => (
                            <TableRow key={inscricao.id}>
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
                                <Badge className={classeStatusInscricao(inscricao.status)}>
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
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
