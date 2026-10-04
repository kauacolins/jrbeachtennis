import Image from "next/image";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/require-admin";
import { GerenciamentoNav } from "@/components/gerenciamento/gerenciamento-nav";
import { AuthStatus } from "@/components/auth/auth-status";

// RNF03: toda rota de admin checa o perfil no servidor. O middleware só
// garante que existe sessão (ver src/middleware.ts); aqui é onde o papel
// (ADMIN/OPERATOR) é de fato validado contra o banco.
export default async function GerenciamentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await exigirAdmin();
  if (!admin) redirect("/entrar?redirect=/gerenciamento");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center rounded-md bg-white p-1">
              <Image
                src="/logo.png"
                alt="Arena JR"
                width={240}
                height={80}
                priority
                className="h-8 w-auto"
              />
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              · Gerenciamento
            </span>
          </div>
          <AuthStatus />
        </div>
        <GerenciamentoNav />
      </header>
      <main>{children}</main>
    </div>
  );
}
