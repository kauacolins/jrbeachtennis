"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth-client";

export function EsqueciSenhaForm() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, startTransition] = useTransition();

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    startTransition(async () => {
      await requestPasswordReset({
        email,
        redirectTo: "/redefinir-senha",
      });
      // Sempre mostra sucesso, exista ou não a conta — evita confirmar pra
      // quem está tentando adivinhar e-mails cadastrados.
      setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-10 text-green-600" aria-hidden />
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Verifique seu e-mail
          </h1>
          <p className="text-sm text-muted-foreground">
            Se <strong>{email}</strong> tiver uma conta na Arena JR, enviamos um
            link para redefinir a senha. Ele vale por 1 hora.
          </p>
        </div>
        <Link
          href="/entrar"
          className="text-center text-sm text-brand-text hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Esqueceu sua senha?
        </h1>
        <p className="text-sm text-muted-foreground">
          Informe seu e-mail e enviamos um link para você criar uma nova senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>

        <Button type="submit" disabled={enviando} className="h-11">
          {enviando ? "Enviando…" : "Enviar link de recuperação"}
        </Button>
      </form>

      <Link
        href="/entrar"
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Voltar para o login
      </Link>
    </div>
  );
}
