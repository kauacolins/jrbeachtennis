import Image from "next/image";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/require-admin";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { GerenciamentoSidebar } from "@/components/gerenciamento/gerenciamento-nav";
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
    <SidebarProvider>
      {/* Fixo e por cima da sidebar (z-40 > z-10 dela) — por isso ela some
          atrás dele no topo em vez de começar do zero junto. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
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
        </div>
        <SairEquipe nome={admin.name} />
      </header>

      <GerenciamentoSidebar ehAdmin={admin.role === "ADMIN"} />

      <SidebarInset className="bg-muted/30 pt-14">{children}</SidebarInset>
    </SidebarProvider>
  );
}
