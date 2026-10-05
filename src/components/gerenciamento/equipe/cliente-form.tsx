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
import { atualizarCliente } from "@/features/usuarios/actions/atualizar-cliente";
import { formatarTelefone } from "@/lib/format";
import type { ClienteAdmin } from "@/features/usuarios/actions/listar-clientes";

interface ClienteFormValues {
  nome: string;
  email: string;
  telefone: string;
}

function valoresIniciais(cliente: ClienteAdmin | null): ClienteFormValues {
  if (!cliente) return { nome: "", email: "", telefone: "" };
  return {
    nome: cliente.name,
    email: cliente.email,
    telefone: cliente.telefone ?? "",
  };
}

// Só edição — cadastro e exclusão de cliente não são daqui, nascem e
// morrem pelo próprio fluxo de autenticação do cliente (ver UsuarioForm,
// que cria/edita conta de equipe e por isso tem mais campos).
export function ClienteForm({
  aberto,
  onOpenChange,
  cliente,
  onSalvo,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  cliente: ClienteAdmin | null;
  onSalvo: () => void;
}) {
  const [valores, setValores] = useState<ClienteFormValues>(() => valoresIniciais(cliente));
  const [salvando, startTransition] = useTransition();

  useEffect(() => {
    if (aberto) setValores(valoresIniciais(cliente));
  }, [aberto, cliente]);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente) return;

    startTransition(async () => {
      const resultado = await atualizarCliente({
        usuarioId: cliente.id,
        nome: valores.nome,
        email: valores.email,
        telefone: valores.telefone,
      });

      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Cliente atualizado.");
      onOpenChange(false);
      onSalvo();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={salvar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente-nome">Nome</Label>
            <Input
              id="cliente-nome"
              required
              minLength={2}
              value={valores.nome}
              onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente-email">E-mail</Label>
            <Input
              id="cliente-email"
              type="email"
              required
              value={valores.email}
              onChange={(e) => setValores((v) => ({ ...v, email: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente-telefone">Celular</Label>
            <Input
              id="cliente-telefone"
              type="tel"
              value={formatarTelefone(valores.telefone)}
              onChange={(e) =>
                setValores((v) => ({
                  ...v,
                  telefone: e.target.value.replace(/\D/g, "").slice(0, 11),
                }))
              }
            />
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
