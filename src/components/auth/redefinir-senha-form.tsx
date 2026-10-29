"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword } from "@/lib/auth-client";

const MENSAGENS_ERRO: Record<string, string> = {
  INVALID_TOKEN: "Esse link expirou ou já foi usado. Peça um novo.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "Senha muito longa.",
};

function traduzirErro(codigo: string | undefined, fallback: string) {
  if (!codigo) return fallback;
  return MENSAGENS_ERRO[codigo] ?? fallback;
}

export function RedefinirSenhaForm({ token }: { token?: string }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Link inválido
          </h1>
          <p className="text-sm text-muted-foreground">
            Esse link de redefinição de senha está incompleto ou expirou.
          </p>
        </div>
        <Button className="h-11" nativeButton={false} render={<Link href="/esqueci-senha" />}>
          Pedir um novo link
        </Button>
      </div>
    );
  }

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    startTransition(async () => {
      const resultado = await resetPassword({ newPassword: senha, token });

      if (resultado.error) {
        setErro(
          traduzirErro(resultado.error.code, "Não foi possível redefinir a senha. Tente de novo.")
        );
        return;
      }

      toast.success("Senha redefinida. Entre com sua nova senha.");
      router.replace("/entrar");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Criar nova senha
        </h1>
        <p className="text-sm text-muted-foreground">
          Escolha a nova senha da sua conta na Arena JR.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="senha">Nova senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
          <Input
            id="confirmar-senha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
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
          {enviando ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}
