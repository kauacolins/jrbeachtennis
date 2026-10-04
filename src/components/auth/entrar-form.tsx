"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/auth/google-icon";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { vincularReservaAoUsuario } from "@/features/reservas/actions/vincular-reserva-usuario";

const MENSAGENS_ERRO: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_EMAIL: "Esse e-mail não parece válido.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "Senha muito longa.",
  USER_ALREADY_EXISTS: "Já existe uma conta com esse e-mail. Tente entrar.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Já existe uma conta com esse e-mail. Tente entrar.",
  USER_NOT_FOUND: "Não encontramos conta com esse e-mail.",
};

function traduzirErro(codigo: string | undefined, fallback: string) {
  if (!codigo) return fallback;
  return MENSAGENS_ERRO[codigo] ?? fallback;
}

export function EntrarForm({
  googleHabilitado,
  reservaId,
  redirectPara,
  modoInicial = "entrar",
  nomeInicial = "",
  telefoneInicial = "",
}: {
  googleHabilitado: boolean;
  reservaId?: string;
  redirectPara: string;
  modoInicial?: "entrar" | "cadastro";
  nomeInicial?: string;
  telefoneInicial?: string;
}) {
  const router = useRouter();
  const session = useSession();
  const [modo, setModo] = useState<"entrar" | "cadastro">(modoInicial);
  const [nome, setNome] = useState(nomeInicial);
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState(telefoneInicial);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();
  const vinculoFeito = useRef(false);

  useEffect(() => {
    if (session.isPending || !session.data?.user || vinculoFeito.current) {
      return;
    }
    vinculoFeito.current = true;

    if (!reservaId) {
      router.replace(redirectPara);
      return;
    }

    startTransition(async () => {
      const resultado = await vincularReservaAoUsuario(reservaId);
      if (resultado.ok) {
        toast.success("Reserva vinculada à sua conta.");
      }
      router.replace(redirectPara);
    });
  }, [session.isPending, session.data, reservaId, redirectPara, router]);

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    startTransition(async () => {
      // `telefone` é um additionalField configurado no servidor (lib/auth.ts);
      // o tipo do client não o conhece sem inferência explícita, mas o
      // servidor aceita — passar por uma variável evita o excess-property
      // check que só vale para literais.
      const dadosCadastro = { email, password: senha, name: nome, telefone };

      const resultado =
        modo === "entrar"
          ? await signIn.email({ email, password: senha })
          : await signUp.email(dadosCadastro);

      if (resultado.error) {
        setErro(
          traduzirErro(
            resultado.error.code,
            "Não foi possível continuar. Tente de novo."
          )
        );
      }
      // Sucesso: useSession atualiza e o efeito acima cuida do redirecionamento.
    });
  }

  function entrarComGoogle() {
    const params = new URLSearchParams();
    if (reservaId) params.set("reserva", reservaId);
    if (redirectPara !== "/minhas-reservas") params.set("redirect", redirectPara);
    const query = params.toString();

    signIn.social({
      provider: "google",
      callbackURL: `/entrar${query ? `?${query}` : ""}`,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {reservaId
            ? modo === "entrar"
              ? "Esse telefone já tem conta. Entre para acompanhar a reserva que você acabou de fazer."
              : "Crie sua conta para acompanhar a reserva que você acabou de fazer — já deixamos nome e telefone preenchidos."
            : "Acompanhe suas reservas na Arena JR."}
        </p>
      </div>

      {googleHabilitado && (
        <>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={entrarComGoogle}
          >
            <GoogleIcon className="size-4" />
            Continuar com o Google
          </Button>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">ou</span>
            <Separator className="flex-1" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {modo === "cadastro" && (
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
        )}

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

        {modo === "cadastro" && (
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
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
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
          {enviando
            ? "Só um instante…"
            : modo === "entrar"
              ? "Entrar"
              : "Criar conta"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setModo(modo === "entrar" ? "cadastro" : "entrar");
          setErro(null);
        }}
        className="text-center text-sm text-brand-text hover:underline"
      >
        {modo === "entrar"
          ? "Não tem conta? Criar uma"
          : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}
