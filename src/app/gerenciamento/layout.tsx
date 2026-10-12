import Image from "next/image";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/require-admin";
import {
  GerenciamentoMenuMobile,
  GerenciamentoNav,
} from "@/components/gerenciamento/gerenciamento-nav";
import { SairEquipe } from "@/components/auth/sair-equipe";

// RNF03: toda rota de admin checa o perfil no servidor. O middleware só
// garante que existe sessão (ver src/middleware.ts); aqui é onde o papel
// (ADMIN/OPERATOR) é de fato validado contra o banco.
export default async function GerenciamentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await exigirAdmin();
  if (!admin) redirect("/admin");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center rounded-md bg-white p-1 dark:bg-transparent dark:p-0">
              <Image
                src="/logo.png"
                alt="Arena JR"
                width={240}
                height={80}
                priority
                className="h-8 w-auto dark:hidden"
              />
              <Image
                src="/logo_branca.png"
                alt="Arena JR"
                width={240}
                height={80}
                priority
                className="hidden h-8 w-auto dark:block"
              />
            </span>
            <span className="hidden text-sm font-normal text-muted-foreground md:inline">
              · Gerenciamento
            </span>
          </div>
          <div className="hidden md:block">
            <SairEquipe nome={admin.name} />
          </div>
          <GerenciamentoMenuMobile ehAdmin={admin.role === "ADMIN"} />
        </div>
        <GerenciamentoNav ehAdmin={admin.role === "ADMIN"} />
      </header>
      <main>{children}</main>
    </div>
  );
}
