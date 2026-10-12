"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn, signOut } from "@/lib/auth-client";
import { sessaoEhDaEquipe } from "@/features/auth/actions/acesso-equipe";

// Login da equipe: só e-mail e senha (conta criada pelo admin em Equipe),
// sem Google e sem cadastro. Conta de cliente não fica logada aqui.
export function AdminEntrarForm({ redirectPara }: { redirectPara: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    startTransition(async () => {
      const resultado = await signIn.email({ email, password: senha });
      if (resultado.error) {
        setErro(
          resultado.error.code === "INVALID_EMAIL_OR_PASSWORD"
            ? "E-mail ou senha incorretos."
            : "Não foi possível entrar. Tente de novo."
        );
        return;
      }

      if (!(await sessaoEhDaEquipe())) {
        await signOut();
        setErro("Essa conta não tem acesso ao gerenciamento.");
        return;
      }

      router.replace(redirectPara);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Acesso da equipe</h1>
        <p className="text-sm text-muted-foreground">Gerenciamento da Arena JR.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-email">E-mail</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin-senha">Senha</Label>
          <Input
            id="admin-senha"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="h-11"
          />
        </div>

        {erro && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden />
            <AlertDescription aria-live="polite">{erro}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={enviando} className="h-11">
          {enviando ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
