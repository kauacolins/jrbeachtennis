"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarPreco } from "@/lib/format";
import { normalizarNomeComanda } from "@/lib/comanda";
import type { ComandaResumo } from "@/features/comandas/actions/listar-comandas";

type Destino = { comandaId: string } | { novoNome: string };

// Passo final da tela "Pedido": de quem é? Mesma lógica do painel (RF31/RF32)
// — digita o nome, toca numa comanda aberta ou abre uma nova; nome igual a
// uma aberta não abre outra (regra 1), o Enter cai na que já existe.
export function EscolherComandaDialog({
  aberto,
  onOpenChange,
  comandas,
  resumo,
  onEscolher,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  comandas: ComandaResumo[];
  resumo: string;
  onEscolher: (destino: Destino) => Promise<boolean>;
}) {
  const [busca, setBusca] = useState("");
  const [pendente, startTransition] = useTransition();

  const termo = normalizarNomeComanda(busca);
  const filtradas = useMemo(
    () =>
      termo
        ? comandas.filter((c) => normalizarNomeComanda(c.nome).includes(termo))
        : comandas,
    [comandas, termo]
  );
  const repetida = comandas.find((c) => normalizarNomeComanda(c.nome) === termo);
  const podeAbrir = termo.length >= 2 && !repetida;

  function escolher(destino: Destino) {
    startTransition(async () => {
      if (await onEscolher(destino)) setBusca("");
    });
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (pendente) return;
    if (repetida) escolher({ comandaId: repetida.id });
    else if (podeAbrir) escolher({ novoNome: busca });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>De quem é o pedido?</DialogTitle>
          <DialogDescription>{resumo}</DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="flex flex-col gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              aria-label="Nome da pessoa"
              placeholder="Buscar comanda ou nome da nova"
              autoFocus
              autoComplete="off"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-11 pl-9"
            />
          </div>
          {/* Sempre visível: sem nome digitado fica desabilitado, mas deixa
              claro que dá pra abrir uma comanda nova daqui. */}
          <Button
            type="submit"
            variant={podeAbrir ? "default" : "outline"}
            className="h-11"
            disabled={!podeAbrir || pendente}
          >
            <Plus aria-hidden />
            {pendente
              ? "Adicionando…"
              : podeAbrir
                ? `Nova comanda “${busca.trim()}”`
                : "Nova comanda"}
          </Button>
          {repetida ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground" aria-live="polite">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              Já existe comanda aberta para &quot;{repetida.nome}&quot;. Toque nela abaixo ou
              acrescente um sobrenome ou apelido para abrir outra.
            </p>
          ) : (
            !podeAbrir && (
              <p className="text-sm text-muted-foreground">
                Digite o nome da pessoa para abrir uma comanda nova.
              </p>
            )
          )}
        </form>

        {comandas.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma comanda aberta ainda.
          </p>
        ) : filtradas.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma comanda aberta com esse nome.
          </p>
        ) : (
          <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {filtradas.map((comanda) => (
              <li key={comanda.id}>
                <button
                  type="button"
                  disabled={pendente}
                  onClick={() => escolher({ comandaId: comanda.id })}
                  className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{comanda.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {comanda.qtdItens} {comanda.qtdItens === 1 ? "item" : "itens"}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatarPreco(comanda.totalCentavos)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
