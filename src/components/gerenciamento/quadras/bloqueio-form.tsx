"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { criarBloqueio } from "@/features/bloqueios/actions/criar-bloqueio";
import type { QuadraAdmin } from "@/features/quadras/actions/listar-quadras-admin";

const VAZIO = {
  quadraId: "",
  dataISO: "",
  horaInicio: "",
  horaFim: "",
  motivo: "",
};

export function BloqueioForm({ quadras }: { quadras: QuadraAdmin[] }) {
  const [form, setForm] = useState(VAZIO);
  const [enviando, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const resultado = await criarBloqueio(form);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Horário bloqueado.");
      setForm(VAZIO);
    });
  }

  return (
    <form onSubmit={enviar} className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="bloqueio-quadra">Quadra</Label>
        <Select
          value={form.quadraId}
          onValueChange={(quadraId) =>
            setForm((f) => ({ ...f, quadraId: quadraId as string }))
          }
        >
          <SelectTrigger id="bloqueio-quadra" className="w-full">
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
        <Label htmlFor="bloqueio-data">Data</Label>
        <Input
          id="bloqueio-data"
          type="date"
          required
          value={form.dataISO}
          onChange={(e) => setForm((f) => ({ ...f, dataISO: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bloqueio-motivo">Motivo (opcional)</Label>
        <Input
          id="bloqueio-motivo"
          placeholder="Manutenção, evento…"
          value={form.motivo}
          onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bloqueio-inicio">Das</Label>
        <Input
          id="bloqueio-inicio"
          type="time"
          required
          value={form.horaInicio}
          onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bloqueio-fim">Até</Label>
        <Input
          id="bloqueio-fim"
          type="time"
          required
          value={form.horaFim}
          onChange={(e) => setForm((f) => ({ ...f, horaFim: e.target.value }))}
        />
      </div>

      <Button type="submit" disabled={enviando} className="sm:col-span-2 sm:self-start">
        {enviando ? "Bloqueando…" : "Bloquear horário"}
      </Button>
    </form>
  );
}
