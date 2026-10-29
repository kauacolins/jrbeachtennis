import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EntrarForm } from "@/components/auth/entrar-form";
import { googleAuthHabilitado } from "@/lib/auth";
import { resolverContatoReserva } from "@/features/reservas/actions/resolver-contato-reserva";

export const metadata: Metadata = {
  title: "Entrar | Arena JR",
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ reserva?: string; redirect?: string }>;
}) {
  const { reserva, redirect } = await searchParams;

  // Vindo do convite "acompanhar essa reserva": o telefone usado na reserva
  // já tem conta? Manda pra login. Não tem? Manda direto pro cadastro, já
  // com nome e telefone preenchidos.
  const contato = reserva ? await resolverContatoReserva(reserva) : null;
  const modoInicial = contato?.contaExiste ? "entrar" : "cadastro";

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-10 px-4 py-12">
      <Link
        href="/"
        className="flex self-center items-center rounded-md bg-white p-1.5 dark:bg-transparent dark:p-0"
      >
        <Image
          src="/logo.png"
          alt="Arena JR"
          width={240}
          height={80}
          priority
          className="h-10 w-auto dark:hidden"
        />
        <Image
          src="/logo_branca.png"
          alt="Arena JR"
          width={240}
          height={80}
          priority
          className="hidden h-10 w-auto dark:block"
        />
      </Link>
      <EntrarForm
        googleHabilitado={googleAuthHabilitado}
        reservaId={reserva}
        redirectPara={redirect ?? "/minhas-reservas"}
        modoInicial={contato ? modoInicial : "entrar"}
        nomeInicial={contato && !contato.contaExiste ? contato.nome : ""}
        telefoneInicial={contato && !contato.contaExiste ? contato.telefone : ""}
      />
    </div>
  );
}
