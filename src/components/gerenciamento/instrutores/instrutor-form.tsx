"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatarTelefone } from "@/lib/format";
import { salvarInstrutor } from "@/features/instrutores/actions/salvar-instrutor";

export interface InstrutorEditavel {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
}

// Criar e editar instrutor (só admin): nome, celular e se está ativo.
export function InstrutorForm({
  aberto,
  onOpenChange,
  instrutor,
  onSalvo,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  instrutor: InstrutorEditavel | null;
  onSalvo: (id: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [salvando, startTransition] = useTransition();

  useEffect(() => {
    if (!aberto) return;
    setNome(instrutor?.nome ?? "");
    setTelefone(instrutor?.telefone ?? "");
    setAtivo(instrutor?.ativo ?? true);
  }, [aberto, instrutor]);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const resultado = await salvarInstrutor({ instrutorId: instrutor?.id, nome, telefone, ativo });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(instrutor ? "Instrutor atualizado." : "Instrutor cadastrado.");
      onOpenChange(false);
      onSalvo(resultado.id);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{instrutor ? "Editar instrutor" : "Novo instrutor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instrutor-nome">Nome</Label>
            <Input
              id="instrutor-nome"
              required
              minLength={2}
              placeholder="Prof. Bruno"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instrutor-telefone">Celular (opcional)</Label>
            <Input
              id="instrutor-telefone"
              type="tel"
              value={formatarTelefone(telefone)}
              onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            />
          </div>
          {instrutor && (
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span className="flex flex-col">
                <span className="font-medium">Ativo</span>
                <span className="text-xs text-muted-foreground">Inativo some das listas e não recebe alunos.</span>
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
  );
}
