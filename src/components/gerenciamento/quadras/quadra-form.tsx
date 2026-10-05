"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarQuadra } from "@/features/quadras/actions/criar-quadra";
import { atualizarQuadra } from "@/features/quadras/actions/atualizar-quadra";
import type { QuadraAdmin } from "@/features/quadras/actions/listar-quadras-admin";
import type { Modalidade } from "@/features/modalidades/actions/listar-modalidades";

const PRECO_HORA_PADRAO_REAIS = "60";

interface QuadraFormValues {
  nome: string;
  precoHoraReais: string;
  modalidadeIds: string[];
}

function valoresIniciais(quadra: QuadraAdmin | null): QuadraFormValues {
  if (!quadra) {
    return {
      nome: "",
      precoHoraReais: PRECO_HORA_PADRAO_REAIS,
      modalidadeIds: [],
    };
  }
  return {
    nome: quadra.nome,
    precoHoraReais: (quadra.precoHoraCentavos / 100).toFixed(2),
    modalidadeIds: quadra.modalidades.map((m) => m.id),
  };
}

// RF10: form de criar/editar quadra, num Dialog reaproveitado pelos dois
// modos (quadra null = criar). Preço digitado em reais, convertido pra
// centavos só no envio — é isso que o banco guarda.
export function QuadraForm({
  aberto,
  onOpenChange,
  quadra,
  modalidades,
  onSalvo,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  quadra: QuadraAdmin | null;
  modalidades: Modalidade[];
  onSalvo: () => void;
}) {
  const [valores, setValores] = useState<QuadraFormValues>(() => valoresIniciais(quadra));
  const [salvando, startTransition] = useTransition();

  useEffect(() => {
    if (aberto) setValores(valoresIniciais(quadra));
  }, [aberto, quadra]);

  function alternarModalidade(id: string) {
    setValores((atual) => ({
      ...atual,
      modalidadeIds: atual.modalidadeIds.includes(id)
        ? atual.modalidadeIds.filter((m) => m !== id)
        : [...atual.modalidadeIds, id],
    }));
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();

    const precoHoraCentavos = Math.round(
      Number(valores.precoHoraReais.replace(",", ".")) * 100
    );
    if (!Number.isFinite(precoHoraCentavos) || precoHoraCentavos < 0) {
      toast.error("Preço inválido.");
      return;
    }

    const payload = {
      nome: valores.nome,
      precoHoraCentavos,
      ativa: quadra?.ativa ?? true,
      modalidadeIds: valores.modalidadeIds,
    };

    startTransition(async () => {
      const resultado = quadra
        ? await atualizarQuadra({ ...payload, quadraId: quadra.id })
        : await criarQuadra(payload);

      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(quadra ? "Quadra atualizada." : "Quadra cadastrada.");
      onOpenChange(false);
      onSalvo();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{quadra ? "Editar quadra" : "Nova quadra"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={salvar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quadra-nome">Nome</Label>
            <Input
              id="quadra-nome"
              required
              minLength={2}
              value={valores.nome}
              onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quadra-preco">Preço por hora (R$)</Label>
            <Input
              id="quadra-preco"
              type="number"
              min="0"
              step="0.01"
              required
              value={valores.precoHoraReais}
              onChange={(e) =>
                setValores((v) => ({ ...v, precoHoraReais: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Modalidades</Label>
            {modalidades.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma modalidade cadastrada ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 rounded-lg border p-2">
                {modalidades.map((modalidade) => (
                  <label key={modalidade.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      checked={valores.modalidadeIds.includes(modalidade.id)}
                      onChange={() => alternarModalidade(modalidade.id)}
                    />
                    {modalidade.nome}
                  </label>
                ))}
              </div>
            )}
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
