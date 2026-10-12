"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCheck, Plus, Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dataParaISO, formatarDataCurta, formatarHora, formatarPreco } from "@/lib/format";
import { normalizarNomeComanda, temNomeESobrenome } from "@/lib/comanda";
import { FecharComandasDialog } from "@/components/gerenciamento/comandas/fechar-comandas-dialog";
import { abrirComanda } from "@/features/comandas/actions/abrir-comanda";
import type { ComandaResumo } from "@/features/comandas/actions/listar-comandas";

// RF31/RF32: o operador digita o nome; se já tem comanda aberta com ele, toca
// nela; se não, abre uma nova com esse nome. Nome igual a uma aberta não
// deixa criar (regra 1) — tem que diferenciar ("João do vôlei"). As caixas da
// tabela selecionam comandas pra fechar várias de uma vez.
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

  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set());
  const [fecharAberto, setFecharAberto] = useState(false);
  // Comanda vazia não fecha (só cancela), então nem entra na seleção. Filtrar
  // pelas abertas atuais descarta as que sumiram depois de um refresh.
  const selecionadas = comandas.filter((c) => selecionados.has(c.id) && c.qtdItens > 0);
  const totalSelecionado = selecionadas.reduce((soma, c) => soma + c.totalCentavos, 0);
  const selecionaveis = filtradas.filter((c) => c.qtdItens > 0);
  const todasMarcadas =
    selecionaveis.length > 0 && selecionaveis.every((c) => selecionados.has(c.id));
  const algumaMarcada = selecionaveis.some((c) => selecionados.has(c.id));

  function alternar(comandaId: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(comandaId)) novo.delete(comandaId);
      else novo.add(comandaId);
      return novo;
    });
  }

  function alternarTodas() {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      for (const c of selecionaveis) {
        if (todasMarcadas) novo.delete(c.id);
        else novo.add(c.id);
      }
      return novo;
    });
  }

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

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-medium">
          {comandas.length} {comandas.length === 1 ? "comanda aberta" : "comandas abertas"}
        </span>
        <span className="flex items-center gap-3">
          <span className="text-muted-foreground">Em aberto: {formatarPreco(totalAberto)}</span>
          {selecionaveis.length > 1 && (
            <Button variant="outline" size="sm" onClick={alternarTodas}>
              <CheckCheck aria-hidden />
              {todasMarcadas ? "Desmarcar todas" : "Selecionar todas"}
            </Button>
          )}
        </span>
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
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Selecionar todas as comandas"
                  className="size-4 cursor-pointer align-middle accent-primary"
                  disabled={selecionaveis.length === 0}
                  checked={todasMarcadas}
                  ref={(el) => {
                    if (el) el.indeterminate = algumaMarcada && !todasMarcadas;
                  }}
                  onChange={alternarTodas}
                />
              </TableHead>
              <TableHead>Comanda</TableHead>
              <TableHead>Aberta</TableHead>
              <TableHead className="hidden sm:table-cell">Itens</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((comanda) => {
              const deOutroDia = dataParaISO(comanda.abertaEm) !== hojeISO;
              const vazia = comanda.qtdItens === 0;
              const marcada = selecionados.has(comanda.id) && !vazia;
              return (
                <TableRow
                  key={comanda.id}
                  className="h-14 cursor-pointer"
                  data-state={marcada ? "selected" : undefined}
                  onClick={() => router.push(`/gerenciamento/comandas/${comanda.id}`)}
                >
                  {/* A célula inteira marca (alvo de toque maior) sem abrir a comanda. */}
                  <TableCell
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!vazia) alternar(comanda.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label={
                        vazia ? `${comanda.nome}: vazia, não dá para fechar` : `Selecionar ${comanda.nome}`
                      }
                      title={vazia ? "Comanda vazia: cancele em vez de fechar" : undefined}
                      className="size-4 cursor-pointer align-middle accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={vazia}
                      checked={marcada}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => alternar(comanda.id)}
                    />
                  </TableCell>
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

      {selecionadas.length > 0 && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <span className="flex-1 text-sm tabular-nums" aria-live="polite">
              <span className="font-medium">
                {selecionadas.length} {selecionadas.length === 1 ? "selecionada" : "selecionadas"}
              </span>
              <span className="text-muted-foreground"> · {formatarPreco(totalSelecionado)}</span>
            </span>
            <Button variant="ghost" className="h-11" onClick={() => setSelecionados(new Set())}>
              Limpar
            </Button>
            <Button className="h-11" onClick={() => setFecharAberto(true)}>
              {selecionadas.length > 1 ? "Fechar selecionadas" : "Fechar selecionada"}
            </Button>
          </div>
        </div>
      )}

      <FecharComandasDialog
        aberto={fecharAberto}
        onOpenChange={setFecharAberto}
        comandas={selecionadas}
        onFechadas={() => {
          setSelecionados(new Set());
          router.refresh();
        }}
      />
    </div>
  );
}
