"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function PerfilForm({
  nomeInicial,
  telefoneInicial,
  email,
}: {
  nomeInicial: string;
  telefoneInicial: string;
  email: string;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [telefone, setTelefone] = useState(telefoneInicial);
  const [salvando, startTransition] = useTransition();

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    startTransition(async () => {
      // `telefone` é um additionalField (lib/auth.ts); passar por uma
      // variável evita o excess-property check que só vale pra literais.
      const dados = { name: nome, telefone };
      const { error } = await authClient.updateUser(dados);

      if (error) {
        toast.error("Não foi possível salvar. Tente de novo.");
        return;
      }
      toast.success("Perfil atualizado.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" value={email} disabled className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          autoComplete="name"
          required
          minLength={2}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="h-11"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telefone">Celular</Label>
        <Input
          id="telefone"
          type="tel"
          autoComplete="tel"
          required
          minLength={8}
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="h-11"
        />
      </div>
      <Button type="submit" disabled={salvando} className="h-11">
        {salvando ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
