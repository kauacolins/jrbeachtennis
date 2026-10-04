import type { Metadata } from "next";
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
        className="self-center font-heading text-xl font-bold tracking-tight"
      >
        ARENA<span className="text-primary">JR</span>
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
