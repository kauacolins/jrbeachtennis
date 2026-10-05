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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarUsuario } from "@/features/usuarios/actions/criar-usuario";
import { atualizarUsuario } from "@/features/usuarios/actions/atualizar-usuario";
import { PAPEIS_EQUIPE } from "@/features/usuarios/schema";
import { formatarTelefone } from "@/lib/format";
import { Role } from "@/app/generated/prisma/enums";
import type { UsuarioAdmin } from "@/features/usuarios/actions/listar-usuarios";

const LABEL_PAPEL: Record<(typeof PAPEIS_EQUIPE)[number], string> = {
  ADMIN: "Admin",
  OPERATOR: "Operador",
  INTRUCTOR: "Instrutor",
};

interface UsuarioFormValues {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  role: (typeof PAPEIS_EQUIPE)[number];
}

function valoresIniciais(usuario: UsuarioAdmin | null): UsuarioFormValues {
  if (!usuario) {
    return { nome: "", email: "", telefone: "", senha: "", role: Role.OPERATOR };
  }
  return {
    nome: usuario.name,
    email: usuario.email,
    telefone: usuario.telefone ?? "",
    senha: "",
    role: usuario.role as (typeof PAPEIS_EQUIPE)[number],
  };
}

// Dialog reaproveitado pra criar e editar conta de equipe (admin/operador/
// instrutor). Senha só existe na criação — o Better Auth cuida de troca de
// senha pelo próprio usuário, não é algo que o admin redefine por aqui.
export function UsuarioForm({
  aberto,
  onOpenChange,
  usuario,
  onSalvo,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  usuario: UsuarioAdmin | null;
  onSalvo: () => void;
}) {
  const [valores, setValores] = useState<UsuarioFormValues>(() => valoresIniciais(usuario));
  const [salvando, startTransition] = useTransition();

  useEffect(() => {
    if (aberto) setValores(valoresIniciais(usuario));
  }, [aberto, usuario]);

  function salvar(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const resultado = usuario
        ? await atualizarUsuario({
            usuarioId: usuario.id,
            nome: valores.nome,
            email: valores.email,
            telefone: valores.telefone,
            role: valores.role,
          })
        : await criarUsuario({
            nome: valores.nome,
            email: valores.email,
            telefone: valores.telefone,
            senha: valores.senha,
            role: valores.role,
          });

      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(usuario ? "Usuário atualizado." : "Usuário cadastrado.");
      onOpenChange(false);
      onSalvo();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{usuario ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={salvar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="usuario-nome">Nome</Label>
            <Input
              id="usuario-nome"
              required
              minLength={2}
              value={valores.nome}
              onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="usuario-email">E-mail</Label>
            <Input
              id="usuario-email"
              type="email"
              required
              value={valores.email}
              onChange={(e) => setValores((v) => ({ ...v, email: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="usuario-telefone">Celular (opcional)</Label>
            <Input
              id="usuario-telefone"
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

          {!usuario && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="usuario-senha">Senha</Label>
              <Input
                id="usuario-senha"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={valores.senha}
                onChange={(e) => setValores((v) => ({ ...v, senha: e.target.value }))}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="usuario-role">Papel</Label>
            <Select
              value={valores.role}
              onValueChange={(valor) =>
                setValores((v) => ({ ...v, role: valor as (typeof PAPEIS_EQUIPE)[number] }))
              }
            >
              <SelectTrigger id="usuario-role" className="h-9!">
                <SelectValue>{(valor: (typeof PAPEIS_EQUIPE)[number]) => LABEL_PAPEL[valor]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAPEIS_EQUIPE.map((papel) => (
                  <SelectItem key={papel} value={papel}>
                    {LABEL_PAPEL[papel]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
