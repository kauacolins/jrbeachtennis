"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarPreco, formatarTelefone } from "@/lib/format";
import { inscrever } from "@/features/torneios/actions/inscrever";
import { PixInstrucoes } from "@/components/torneios/pix-instrucoes";

interface AtletaForm {
  nome: string;
  celular: string;
}

// Inscrição numa categoria (docs/TORNEIOS.md): o primeiro atleta é quem tá
// logado (prefilled, mas editável); os demais (dupla, time) não precisam
// ter conta — só nome e celular.
export function InscricaoForm({
  categoriaId,
  minAtletas,
  maxAtletas,
  valorCentavos,
  nomeUsuario,
  telefoneUsuario,
}: {
  categoriaId: string;
  minAtletas: number;
  maxAtletas: number;
  valorCentavos: number;
  nomeUsuario: string;
  telefoneUsuario: string;
}) {
  const router = useRouter();
  const [nomeEquipe, setNomeEquipe] = useState("");
  const [atletas, setAtletas] = useState<AtletaForm[]>(() => {
    const linhas: AtletaForm[] = [{ nome: nomeUsuario, celular: telefoneUsuario }];
    while (linhas.length < minAtletas) linhas.push({ nome: "", celular: "" });
    return linhas;
  });
  const [enviando, startTransition] = useTransition();

  const emEquipe = maxAtletas > 1;

  function atualizarAtleta(indice: number, patch: Partial<AtletaForm>) {
    setAtletas((atual) => atual.map((atleta, i) => (i === indice ? { ...atleta, ...patch } : atleta)));
  }

  function adicionarAtleta() {
    setAtletas((atual) => (atual.length < maxAtletas ? [...atual, { nome: "", celular: "" }] : atual));
  }

  function removerAtleta(indice: number) {
    setAtletas((atual) => (atual.length > minAtletas ? atual.filter((_, i) => i !== indice) : atual));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const resultado = await inscrever({
        categoriaId,
        nomeEquipe: nomeEquipe || undefined,
        atletas,
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Inscrição feita!");
      router.push("/minhas-inscricoes");
    });
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      {emEquipe && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inscricao-equipe">Nome do time (opcional)</Label>
          <Input
            id="inscricao-equipe"
            placeholder="Ex.: Irmãos da areia"
            value={nomeEquipe}
            onChange={(e) => setNomeEquipe(e.target.value)}
            className="h-11"
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{emEquipe ? "Atletas" : "Seus dados"}</Label>
          {emEquipe && (
            <span className="text-xs text-muted-foreground">
              {atletas.length} de {maxAtletas}
            </span>
          )}
        </div>

        {atletas.map((atleta, indice) => (
          <div key={indice} className="flex flex-col gap-3 rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {indice + 1}
                </span>
                <span className="text-sm font-medium">
                  {indice === 0 ? "Você" : `Atleta ${indice + 1}`}
                </span>
              </div>
              {indice >= minAtletas && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removerAtleta(indice)}
                >
                  <Trash2 aria-hidden />
                  <span className="sr-only">Remover atleta</span>
                </Button>
              )}
            </div>
            <Input
              placeholder="Nome e sobrenome"
              required
              minLength={2}
              value={atleta.nome}
              onChange={(e) => atualizarAtleta(indice, { nome: e.target.value })}
              className="h-11"
            />
            <Input
              type="tel"
              placeholder="Celular"
              required
              minLength={8}
              value={formatarTelefone(atleta.celular)}
              onChange={(e) =>
                atualizarAtleta(indice, { celular: e.target.value.replace(/\D/g, "").slice(0, 11) })
              }
              className="h-11"
            />
          </div>
        ))}

        {atletas.length < maxAtletas && (
          <Button type="button" variant="outline" className="h-11 self-start" onClick={adicionarAtleta}>
            <Plus aria-hidden />
            Adicionar atleta
          </Button>
        )}
      </div>

      <PixInstrucoes />

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pb-0">
        <div className="text-sm">
          <p className="text-muted-foreground">Total</p>
          <p className="font-heading text-lg font-semibold">{formatarPreco(valorCentavos)}</p>
        </div>
        <Button type="submit" className="h-11 flex-1 sm:flex-none sm:px-8" disabled={enviando}>
          {enviando ? "Enviando…" : "Confirmar inscrição"}
        </Button>
      </div>
    </form>
  );
}
