import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RedefinirSenhaForm } from "@/components/auth/redefinir-senha-form";

export const metadata: Metadata = {
  title: "Redefinir senha | Arena JR",
  robots: { index: false },
};

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token } = await searchParams;

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
      <RedefinirSenhaForm token={token} />
    </div>
  );
}
