import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, ShoppingBag } from "lucide-react";
import { exigirAdmin } from "@/lib/require-admin";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { GerenciamentoSidebar, TituloPagina } from "@/components/gerenciamento/gerenciamento-nav";
import { SairEquipe } from "@/components/auth/sair-equipe";
import { ThemeToggle } from "@/components/theme-toggle";

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
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-2 border-b bg-background px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="size-10 md:hidden" />
          <Link
            href="/"
            className="flex items-center rounded-md bg-white p-1 md:hidden dark:bg-transparent dark:p-0"
          >
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
          </Link>
          <div className="hidden md:block">
            <TituloPagina />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="hidden h-11 px-4 sm:flex"
            nativeButton={false}
            render={<Link href="/gerenciamento/agenda" />}
          >
            <CalendarPlus aria-hidden />
            Nova reserva
          </Button>
          <Button
            size="lg"
            className="h-11 px-4 text-base font-semibold sm:px-5 [&_svg]:size-5!"
            nativeButton={false}
            render={<Link href="/gerenciamento/comandas/pedido" />}
          >
            <ShoppingBag aria-hidden />
            Venda rápida
          </Button>
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <SairEquipe nome={admin.name} />
          </div>
        </div>
      </header>

      <GerenciamentoSidebar ehAdmin={admin.role === "ADMIN"} nome={admin.name} />

      {/* Padding padrão de toda tela do painel fica aqui, não em cada page.tsx. */}
      <SidebarInset className="min-w-0 bg-muted/30 pt-16">
        <div className="px-4 py-4 md:px-6 md:py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
