import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PerfilForm } from "@/components/account/perfil-form";
import { getSessaoAtual } from "@/lib/get-session";

export const metadata: Metadata = {
  title: "Meu perfil | Arena JR",
};

export default async function PerfilPage() {
  const sessao = await getSessaoAtual();
  if (!sessao?.user) {
    redirect("/entrar?redirect=/perfil");
  }

  const usuario = sessao.user as typeof sessao.user & {
    telefone?: string | null;
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Meu perfil
      </h1>
      <PerfilForm
        nomeInicial={usuario.name}
        telefoneInicial={usuario.telefone ?? ""}
        email={usuario.email}
      />
    </div>
  );
}
