"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { cn } from "@/lib/utils";
import { formatarPreco } from "@/lib/format";
import { salvarPlanoAula } from "@/features/instrutores/actions/salvar-instrutor";
import type { PlanoAulaLinha } from "@/features/instrutores/actions/listar-instrutores";

function reaisParaCentavos(valor: string) {
  const centavos = Math.round(Number(valor.replace(",", ".")) * 100);
  return Number.isFinite(centavos) && centavos >= 0 ? centavos : null;
}

// Planos e preços do instrutor ("2x por semana", R$ 200). Preço novo vale
// só pras mensalidades lançadas daqui pra frente.
export function PlanosAula({
  instrutorId,
  planos,
  podeEditar,
}: {
  instrutorId: string;
  planos: PlanoAulaLinha[];
  podeEditar: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [plano, setPlano] = useState<PlanoAulaLinha | null>(null);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("30");
  const [ativo, setAtivo] = useState(true);
  const [salvando, startTransition] = useTransition();

  useEffect(() => {
    if (!aberto) return;
    setNome(plano?.nome ?? "");
    setPreco(plano ? (plano.precoCentavos / 100).toFixed(2) : "");
    setDuracao(String(plano?.duracaoDias ?? 30));
    setAtivo(plano?.ativo ?? true);
  }, [aberto, plano]);

  function abrir(p: PlanoAulaLinha | null) {
    setPlano(p);
    setAberto(true);
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const precoCentavos = reaisParaCentavos(preco);
    if (precoCentavos === null) {
      toast.error("Preço inválido.");
      return;
    }
    startTransition(async () => {
      const resultado = await salvarPlanoAula({
        planoId: plano?.id,
        instrutorId,
        nome,
        precoCentavos,
        duracaoDias: Number(duracao) || 30,
        ativo,
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(plano ? "Plano atualizado." : "Plano criado.");
      setAberto(false);
      router.refresh();
    });
  }

  if (!podeEditar && planos.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-label="Planos e preços">
      <CabecalhoLista
        secao
        titulo="Planos e preços"
        acao={
          podeEditar && (
            <Button variant="outline" onClick={() => abrir(null)}>
              <Plus aria-hidden />
              Novo plano
            </Button>
          )
        }
      />
      {planos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Cadastre pelo menos um plano (nome e preço) pra matricular alunos.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {planos.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                disabled={!podeEditar}
                onClick={() => abrir(p)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors enabled:hover:bg-muted",
                  !p.ativo && "opacity-60"
                )}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{p.nome}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatarPreco(p.precoCentavos)} · {p.duracaoDias} dias{!p.ativo && " · inativo"}
                  </span>
                </span>
                {podeEditar && <Pencil className="size-3.5 text-muted-foreground" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{plano ? "Editar plano" : "Novo plano de aula"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plano-nome">Nome</Label>
              <Input
                id="plano-nome"
                required
                minLength={2}
                placeholder="2x por semana"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plano-preco">Preço (R$)</Label>
                <Input
                  id="plano-preco"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plano-duracao">Duração (dias)</Label>
                <Input
                  id="plano-duracao"
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                />
              </div>
            </div>
            {plano && (
              <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <span className="flex flex-col">
                  <span className="font-medium">Ativo</span>
                  <span className="text-xs text-muted-foreground">
                    Inativo não aparece pra novas matrículas; quem já está nele continua.
                  </span>
                </span>
                <Switch checked={ativo} onCheckedChange={setAtivo} />
              </label>
            )}
            <DialogFooter>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
