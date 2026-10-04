"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

export function AuthStatus() {
  const router = useRouter();
  const session = useSession();

  if (session.isPending) {
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
