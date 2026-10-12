"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dataParaISO, formatarDataCurta, formatarHora, formatarPreco } from "@/lib/format";
import { normalizarNomeComanda, temNomeESobrenome } from "@/lib/comanda";
import { abrirComanda } from "@/features/comandas/actions/abrir-comanda";
import type { ComandaResumo } from "@/features/comandas/actions/listar-comandas";

// RF31/RF32: o operador digita o nome; se já tem comanda aberta com ele, toca
// nela; se não, abre uma nova com esse nome. Nome igual a uma aberta não
// deixa criar (regra 1) — tem que diferenciar ("João do vôlei").
export function ComandasPainel({
  comandas,
  hojeISO,
}: {
  comandas: ComandaResumo[];
  hojeISO: string;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [abrindo, startTransition] = useTransition();

  const termo = normalizarNomeComanda(busca);
  const filtradas = useMemo(
    () =>
      termo
        ? comandas.filter((c) => normalizarNomeComanda(c.nome).includes(termo))
        : comandas,
    [comandas, termo]
  );
  const repetida = comandas.find((c) => normalizarNomeComanda(c.nome) === termo);
  // Comanda nova pede nome e sobrenome, pra achar a pessoa depois na busca.
  const podeAbrir = temNomeESobrenome(busca) && !repetida;
  const totalAberto = comandas.reduce((soma, c) => soma + c.totalCentavos, 0);

  function abrir(e?: React.FormEvent) {
    e?.preventDefault();
    if (repetida) {
      router.push(`/gerenciamento/comandas/${repetida.id}`);
      return;
    }
    if (!podeAbrir) return;
    startTransition(async () => {
      const resultado = await abrirComanda(busca);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      router.push(`/gerenciamento/comandas/${resultado.comandaId}`);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={abrir} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            aria-label="Nome da pessoa"
            placeholder="Nome e sobrenome da pessoa"
            autoFocus
            autoComplete="off"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
        <Button type="submit" className="h-11" disabled={!podeAbrir || abrindo}>
          <Plus aria-hidden />
          {abrindo
            ? "Abrindo…"
            : podeAbrir
              ? `Nova comanda “${busca.trim()}”`
              : "Nova comanda"}
        </Button>
      </form>

      {repetida ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground" aria-live="polite">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          Já existe comanda aberta para &quot;{repetida.nome}&quot;. Toque nela abaixo ou
          acrescente um sobrenome ou apelido para abrir outra.
        </p>
      ) : (
        termo &&
        !podeAbrir && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Para abrir uma comanda nova, digite também o sobrenome.
          </p>
        )
      )}

      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">
          {comandas.length} {comandas.length === 1 ? "comanda aberta" : "comandas abertas"}
        </span>
        <span className="text-muted-foreground">Em aberto: {formatarPreco(totalAberto)}</span>
      </div>

      {comandas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <Receipt className="size-6" aria-hidden />
          Nenhuma comanda aberta. Digite nome e sobrenome da pessoa acima para abrir a primeira.
        </div>
      ) : filtradas.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma comanda aberta com esse nome.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comanda</TableHead>
              <TableHead>Aberta</TableHead>
              <TableHead className="hidden sm:table-cell">Itens</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((comanda) => {
              const deOutroDia = dataParaISO(comanda.abertaEm) !== hojeISO;
              return (
                <TableRow
                  key={comanda.id}
                  className="h-14 cursor-pointer"
                  onClick={() => router.push(`/gerenciamento/comandas/${comanda.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/gerenciamento/comandas/${comanda.id}`}
                      className="underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {comanda.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {deOutroDia ? (
                      <Badge className="bg-warning text-warning-foreground">
                        {formatarDataCurta(comanda.abertaEm)}
                      </Badge>
                    ) : (
                      <span className="tabular-nums">{formatarHora(comanda.abertaEm)}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                    {comanda.qtdItens}
                  </TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap tabular-nums">
                    {formatarPreco(comanda.totalCentavos)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
