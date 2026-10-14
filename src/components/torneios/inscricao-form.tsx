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
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Valor da inscrição:{" "}
        <span className="font-medium text-foreground">{formatarPreco(valorCentavos)}</span>
      </p>

      {maxAtletas > 1 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inscricao-equipe">Nome do time (opcional)</Label>
          <Input
            id="inscricao-equipe"
            value={nomeEquipe}
            onChange={(e) => setNomeEquipe(e.target.value)}
            className="h-11"
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {atletas.map((atleta, indice) => (
          <div key={indice} className="flex flex-col gap-2 rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <Label>{indice === 0 ? "Você" : `Atleta ${indice + 1}`}</Label>
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
      </div>

      {atletas.length < maxAtletas && (
        <Button type="button" variant="outline" className="h-11 self-start" onClick={adicionarAtleta}>
          <Plus aria-hidden />
          Adicionar atleta
        </Button>
      )}

      <Button type="submit" className="h-11" disabled={enviando}>
        {enviando ? "Enviando…" : "Confirmar inscrição"}
      </Button>
    </form>
  );
}
