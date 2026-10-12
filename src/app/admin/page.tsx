import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/require-admin";
import { AdminEntrarForm } from "@/components/auth/admin-entrar-form";

export const metadata: Metadata = {
  title: "Acesso da equipe | Arena JR",
  robots: { index: false },
};

// Login da equipe (ADMIN/OPERATOR), separado do login de cliente em
// /entrar. Quem já está logado como equipe vai direto pro gerenciamento.
export default async function AdminEntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: destino } = await searchParams;
  // só aceita voltar pra dentro do gerenciamento (evita open redirect)
  const redirectPara = destino?.startsWith("/gerenciamento") ? destino : "/gerenciamento";

  if (await exigirAdmin()) redirect(redirectPara);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-10 px-4 py-12">
      <span className="flex self-center items-center rounded-md bg-white p-1.5 dark:bg-transparent dark:p-0">
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
      </span>
      <AdminEntrarForm redirectPara={redirectPara} />
    </div>
  );
}
