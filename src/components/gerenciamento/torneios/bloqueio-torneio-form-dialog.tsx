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
import { SeletorData } from "@/components/gerenciamento/seletor-data";
import { bloquearQuadraTorneio } from "@/features/torneios/actions/bloquear-quadra-torneio";
import type { QuadraAdmin } from "@/features/quadras/actions/listar-quadras-admin";

const VAZIO = { quadraId: "", dataISO: "", horaInicio: "", horaFim: "", motivo: "" };

// Bloqueia a quadra pro torneio: mesma ideia do bloqueio comum (RF12), só
// que já marcado com o torneio (docs/TORNEIOS.md, passo 3).
export function BloqueioTorneioFormDialog({
  aberto,
  onOpenChange,
  torneioId,
  quadras,
  onSalvo,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  torneioId: string;
  quadras: QuadraAdmin[];
  onSalvo: () => void;
}) {
  const [form, setForm] = useState(VAZIO);
  const [salvando, startTransition] = useTransition();

  useEffect(() => {
    if (aberto) setForm(VAZIO);
  }, [aberto]);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const resultado = await bloquearQuadraTorneio({ ...form, torneioId });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Quadra bloqueada para o torneio.");
      onOpenChange(false);
      onSalvo();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bloquear quadra</DialogTitle>
        </DialogHeader>

        <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="bloqueio-torneio-quadra">Quadra</Label>
            <Select
              value={form.quadraId}
              onValueChange={(quadraId) => setForm((f) => ({ ...f, quadraId: quadraId as string }))}
            >
              <SelectTrigger id="bloqueio-torneio-quadra" className="w-full">
                <SelectValue placeholder="Escolha a quadra" />
              </SelectTrigger>
              <SelectContent>
                {quadras.map((quadra) => (
                  <SelectItem key={quadra.id} value={quadra.id}>
                    {quadra.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Data</Label>
            <SeletorData
              valor={form.dataISO}
              onAlterar={(dataISO) => setForm((f) => ({ ...f, dataISO }))}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bloqueio-torneio-motivo">Motivo (opcional)</Label>
            <Input
              id="bloqueio-torneio-motivo"
              placeholder="Programação do torneio"
              value={form.motivo}
              onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bloqueio-torneio-inicio">Das</Label>
            <Input
              id="bloqueio-torneio-inicio"
              type="time"
              required
              value={form.horaInicio}
              onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bloqueio-torneio-fim">Até</Label>
            <Input
              id="bloqueio-torneio-fim"
              type="time"
              required
              value={form.horaFim}
              onChange={(e) => setForm((f) => ({ ...f, horaFim: e.target.value }))}
            />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? "Bloqueando…" : "Bloquear horário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
