"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salvarCategoria } from "@/features/torneios/actions/salvar-categoria";
import type { CategoriaDoTorneio } from "@/features/torneios/actions/obter-torneio";
import type { Modalidade } from "@/features/modalidades/actions/listar-modalidades";

interface Valores {
  modalidadeId: string;
  nome: string;
  minAtletas: string;
  maxAtletas: string;
  valorReais: string;
  vagas: string;
}

function valoresIniciais(categoria: CategoriaDoTorneio | null, modalidades: Modalidade[]): Valores {
  if (!categoria) {
    return {
      modalidadeId: modalidades[0]?.id ?? "",
      nome: "",
      minAtletas: "1",
      maxAtletas: "1",
      valorReais: "",
      vagas: "",
    };
  }
  return {
    modalidadeId: categoria.modalidadeId,
    nome: categoria.nome,
    minAtletas: String(categoria.minAtletas),
    maxAtletas: String(categoria.maxAtletas),
    valorReais: (categoria.valorCentavos / 100).toFixed(2),
    vagas: categoria.vagas?.toString() ?? "",
  };
}

// Categoria = modalidade + nome livre + mínimo/máximo de atletas por
// inscrição (docs/TORNEIOS.md, "Ideia: torneio genérico"). Serve pra
// simples, dupla, mista ou time — o sistema não valida nível nem gênero.
export function CategoriaFormDialog({
  aberto,
  onOpenChange,
  torneioId,
  categoria,
  modalidades,
  onSalvo,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  torneioId: string;
  categoria: CategoriaDoTorneio | null;
  modalidades: Modalidade[];
  onSalvo: () => void;
}) {
  const [valores, setValores] = useState<Valores>(() => valoresIniciais(categoria, modalidades));
  const [salvando, startTransition] = useTransition();

  useEffect(() => {
    if (aberto) setValores(valoresIniciais(categoria, modalidades));
  }, [aberto, categoria, modalidades]);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const valorCentavos = Math.round(Number(valores.valorReais.replace(",", ".")) * 100);
    if (!Number.isFinite(valorCentavos) || valorCentavos < 0) {
      toast.error("Valor da inscrição inválido.");
      return;
    }
    startTransition(async () => {
      const resultado = await salvarCategoria({
        categoriaId: categoria?.id,
        torneioId,
        modalidadeId: valores.modalidadeId,
        nome: valores.nome,
        minAtletas: valores.minAtletas,
        maxAtletas: valores.maxAtletas,
        valorCentavos,
        vagas: valores.vagas || undefined,
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(categoria ? "Categoria atualizada." : "Categoria cadastrada.");
      onOpenChange(false);
      onSalvo();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{categoria ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={salvar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoria-modalidade">Modalidade</Label>
            <Select
              value={valores.modalidadeId}
              onValueChange={(modalidadeId) => setValores((v) => ({ ...v, modalidadeId: modalidadeId as string }))}
            >
              <SelectTrigger id="categoria-modalidade" className="w-full">
                <SelectValue placeholder="Escolha a modalidade">
                  {(valor: string) => modalidades.find((m) => m.id === valor)?.nome ?? ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {modalidades.map((modalidade) => (
                  <SelectItem key={modalidade.id} value={modalidade.id}>
                    {modalidade.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoria-nome">Nome da categoria</Label>
            <Input
              id="categoria-nome"
              required
              placeholder="Dupla Masc. C"
              value={valores.nome}
              onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoria-min">Mínimo de atletas</Label>
              <Input
                id="categoria-min"
                type="number"
                min="1"
                max="50"
                required
                value={valores.minAtletas}
                onChange={(e) => setValores((v) => ({ ...v, minAtletas: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoria-max">Máximo de atletas</Label>
              <Input
                id="categoria-max"
                type="number"
                min="1"
                max="50"
                required
                value={valores.maxAtletas}
                onChange={(e) => setValores((v) => ({ ...v, maxAtletas: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoria-valor">Valor da inscrição (R$)</Label>
              <Input
                id="categoria-valor"
                type="number"
                min="0"
                step="0.01"
                required
                value={valores.valorReais}
                onChange={(e) => setValores((v) => ({ ...v, valorReais: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoria-vagas">Vagas (opcional)</Label>
              <Input
                id="categoria-vagas"
                type="number"
                min="1"
                placeholder="Sem limite"
                value={valores.vagas}
                onChange={(e) => setValores((v) => ({ ...v, vagas: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
