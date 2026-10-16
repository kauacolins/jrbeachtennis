"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { BuscarCliente } from "@/components/gerenciamento/balcao/buscar-cliente";
import { SeletorMetodo } from "@/components/gerenciamento/balcao/seletor-metodo";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { filtrarPorBusca } from "@/lib/busca";
import { cn } from "@/lib/utils";
import { formatarDataCurta, formatarPreco, formatarTelefone } from "@/lib/format";
import { ativarPlano, cancelarPlano, type FiltroPlano, type PlanoLinha } from "@/features/planos/actions/planos";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";

const ABAS: { valor: FiltroPlano; label: string }[] = [
  { valor: "ativos", label: "Ativos" },
  { valor: "vencendo", label: "Vencendo" },
  { valor: "vencidos", label: "Vencidos" },
];

const VAZIO: Record<FiltroPlano, string> = {
  ativos: "Nenhum plano mensal ativo.",
  vencendo: "Nenhum plano vence nos próximos 7 dias.",
  vencidos: "Ninguém com plano vencido.",
};

// RF20: o mensal é vendido no balcão e já entra pago. Renovar começa no fim
// do plano atual, então dá pra renovar antes de vencer sem perder dias.
export function PlanosLista({
  planos,
  filtro,
  precoCentavos,
}: {
  planos: PlanoLinha[];
  filtro: FiltroPlano;
  precoCentavos: number | null;
}) {
  const router = useRouter();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [cliente, setCliente] = useState<{ id: string; nome: string } | null>(null);
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [pendente, startTransition] = useTransition();
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(planos, busca, (p) => [p.nome, p.telefone]);

  function abrir(paraCliente: { id: string; nome: string } | null) {
    setCliente(paraCliente);
    setMetodo(null);
    setDialogAberto(true);
  }

  function confirmar() {
    if (!cliente || !metodo) return;
    startTransition(async () => {
      const resultado = await ativarPlano({ clienteId: cliente.id, metodo });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(`Mensal de ${cliente.nome} vale até ${formatarDataCurta(resultado.fim)}.`);
      setDialogAberto(false);
      router.refresh();
    });
  }

  function cancelar(clienteId: string) {
    startTransition(async () => {
      const resultado = await cancelarPlano(clienteId);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Plano cancelado.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Planos mensais</h1>
        <Button size="sm" onClick={() => abrir(null)}>
          <Plus aria-hidden />
          Ativar plano
        </Button>
      </div>

      <nav aria-label="Situação do plano" className="flex gap-1">
        {ABAS.map((aba) => (
          <Link
            key={aba.valor}
            href={`/gerenciamento/planos?filtro=${aba.valor}`}
            aria-current={aba.valor === filtro ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              aba.valor === filtro
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {aba.label}
          </Link>
        ))}
      </nav>

      {planos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <CalendarCheck className="size-6" aria-hidden />
          {VAZIO[filtro]}
        </div>
      ) : (
        <>
          <CampoBusca
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome ou telefone"
            ariaLabel="Buscar plano"
          />
          {visiveis.length === 0 ? (
            <SemResultadoBusca busca={busca} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="hidden sm:table-cell">Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((plano) => (
                  <TableRow key={plano.id}>
                    <TableCell className="font-medium">{plano.nome}</TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                      {plano.telefone ? formatarTelefone(plano.telefone) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {plano.ativo
                        ? `até ${formatarDataCurta(plano.fim)}`
                        : plano.cancelado
                          ? `ia até ${formatarDataCurta(plano.fim)}`
                          : `venceu ${formatarDataCurta(plano.fim)}`}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {plano.vencendo ? (
                        <Badge className="bg-warning text-warning-foreground">Vence em breve</Badge>
                      ) : plano.ativo ? (
                        <Badge className="bg-accent text-accent-foreground">Ativo</Badge>
                      ) : plano.cancelado ? (
                        <Badge className="bg-muted text-muted-foreground">Cancelado</Badge>
                      ) : (
                        <Badge variant="destructive">Vencido</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrir({ id: plano.clienteId, nome: plano.nome })}
                        >
                          Renovar
                        </Button>
                        {plano.ativo && (
                          <ConfirmarBotao
                            size="sm"
                            variant="ghost"
                            actionVariant="destructive"
                            label="Cancelar"
                            titulo={`Cancelar o mensal de ${plano.nome}?`}
                            descricao="O day use deixa de sair por R$ 0 a partir de agora. Não há estorno automático."
                            textoConfirmar="Cancelar plano"
                            textoConfirmando="Cancelando…"
                            disabled={pendente}
                            onConfirmar={() => cancelar(plano.clienteId)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cliente ? `Mensal de ${cliente.nome}` : "Ativar plano mensal"}</DialogTitle>
            <DialogDescription>
              {cliente
                ? "Se o plano ainda está ativo, os 30 dias novos começam quando ele vencer."
                : "Busque o cliente ou faça o cadastro rápido."}
            </DialogDescription>
          </DialogHeader>

          {!cliente ? (
            dialogAberto && (
              <BuscarCliente acaoLabel="Escolher" onSelecionar={(c) => setCliente({ id: c.id, nome: c.nome })} />
            )
          ) : (
            <>
              {precoCentavos !== null && (
                <p className="text-center text-3xl font-semibold tabular-nums">
                  {formatarPreco(precoCentavos)}
                </p>
              )}
              <SeletorMetodo valor={metodo} onChange={setMetodo} />
              <DialogFooter>
                <Button className="h-11 w-full" disabled={!metodo || pendente} onClick={confirmar}>
                  {pendente ? "Salvando…" : "Confirmar pagamento"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
