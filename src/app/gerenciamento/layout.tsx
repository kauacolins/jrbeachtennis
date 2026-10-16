import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, ShoppingBag } from "lucide-react";
import { exigirAdmin } from "@/lib/require-admin";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { GerenciamentoSidebar, TituloPagina } from "@/components/gerenciamento/gerenciamento-nav";
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
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <span className="flex items-center rounded-md bg-white p-1 md:hidden dark:bg-transparent dark:p-0">
            <Image
              src="/logo.png"
              alt="Arena JR"
              width={160}
              height={53}
              priority
              className="h-7 w-auto dark:hidden"
            />
            <Image
              src="/logo_branca.png"
              alt="Arena JR"
              width={160}
              height={53}
              priority
              className="hidden h-7 w-auto dark:block"
            />
          </span>
          <div className="hidden md:block">
            <TituloPagina />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            render={<Link href="/gerenciamento/agenda" />}
          >
            <CalendarPlus aria-hidden />
            Nova reserva
          </Button>
          <Button size="sm" render={<Link href="/gerenciamento/comandas/pedido" />}>
            <ShoppingBag aria-hidden />
            Venda rápida
          </Button>
          <SairEquipe nome={admin.name} />
        </div>
      </header>

      <GerenciamentoSidebar ehAdmin={admin.role === "ADMIN"} />

      <SidebarInset className="bg-muted/30 pt-14">{children}</SidebarInset>
    </SidebarProvider>
  );
}
