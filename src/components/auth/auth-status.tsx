"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

// O client do better-auth pode resolver a sessão a partir de um cache de
// cookie já na primeira renderização do cliente — antes do efeito rodar.
// Isso faz o cliente pular direto pro estado "logado", enquanto o servidor
// (sem acesso a esse cache) renderizou o placeholder, gerando mismatch de
// hidratação. Só confia no estado real da sessão depois de montado, pra
// garantir que a primeira renderização do cliente bata com a do servidor.
function useMontado() {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
}

export function AuthStatus() {
  const router = useRouter();
  const session = useSession();
  const montado = useMontado();

  if (!montado || session.isPending) {
    return <div className="h-11 w-16" aria-hidden />;
  }

  if (session.data?.user) {
    const primeiroNome = session.data.user.name.split(" ")[0];
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/minhas-reservas"
          className="text-sm font-medium transition-colors hover:text-brand-text"
        >
          Olá, {primeiroNome}
        </Link>
        <Button
          variant="ghost"
          className="h-11"
          onClick={async () => {
            await signOut();
            router.push("/");
            router.refresh();
          }}
        >
          Sair
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="h-11"
      render={<Link href="/entrar" />}
      nativeButton={false}
    >
      Entrar
    </Button>
  );
}

// Versão enxuta pra landing page: nada de "Olá, {nome}"/"Sair" ali, só um
// botão "Entrar" que já manda quem tem sessão direto pro gerenciamento.
export function AuthEntrarButton() {
  const session = useSession();
  const montado = useMontado();

  if (!montado || session.isPending) {
    return <div className="h-11 w-20" aria-hidden />;
  }

  const destino = session.data?.user ? "/gerenciamento" : "/entrar";

  return (
    <Button
      variant="outline"
      className="h-11"
      render={<Link href={destino} />}
      nativeButton={false}
    >
      Entrar
    </Button>
  );
}
