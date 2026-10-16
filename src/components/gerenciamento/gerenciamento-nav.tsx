"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  LandPlot,
  LayoutDashboard,
  Megaphone,
  Package,
  Receipt,
  Ticket,
  Trophy,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface SubLinkNav {
  href: string;
  label: string;
}

interface LinkNav {
  href: string;
  label: string;
  icon: LucideIcon;
  somenteAdmin?: boolean;
  subitens?: SubLinkNav[];
}

// Agrupamento do admin-panel-ui: Principal (operação do dia), Clientes,
// Eventos (torneios) e Configuração (baixa frequência). "Reservas" tem só
// Bloqueios por enquanto — Lista de reservas ainda não existe como tela
// própria (hoje mora dentro da Agenda).
const GRUPOS: { titulo?: string; links: LinkNav[] }[] = [
  {
    titulo: "Principal",
    links: [
      { href: "/gerenciamento", label: "Dashboard", icon: LayoutDashboard },
      { href: "/gerenciamento/agenda", label: "Agenda", icon: CalendarDays },
      {
        href: "/gerenciamento/quadras/bloqueios",
        label: "Reservas",
        icon: CalendarClock,
        subitens: [{ href: "/gerenciamento/quadras/bloqueios", label: "Bloqueios" }],
      },
      { href: "/gerenciamento/comandas", label: "Comandas", icon: Receipt },
      { href: "/gerenciamento/day-use", label: "Day use", icon: Ticket },
    ],
  },
  {
    titulo: "Clientes",
    links: [
      { href: "/gerenciamento/equipe/clientes", label: "Clientes", icon: Users },
      { href: "/gerenciamento/planos", label: "Mensalistas", icon: UserRound },
    ],
  },
  {
    titulo: "Eventos",
    links: [{ href: "/gerenciamento/torneios", label: "Torneios", icon: Trophy, somenteAdmin: true }],
  },
  {
    titulo: "Configuração",
    links: [
      { href: "/gerenciamento/quadras", label: "Quadras e horários", icon: LandPlot },
      { href: "/gerenciamento/produtos", label: "Produtos e preços", icon: Package, somenteAdmin: true },
      { href: "/gerenciamento/eventos", label: "Eventos", icon: Megaphone },
      { href: "/gerenciamento/equipe", label: "Equipe", icon: UsersRound },
    ],
  },
];

function ehLinkAtivo(pathname: string, href: string) {
  return href === "/gerenciamento" ? pathname === href : pathname.startsWith(href);
}

function useGrupos(ehAdmin: boolean) {
  const pathname = usePathname();
  return GRUPOS.map((grupo) => ({
    ...grupo,
    links: grupo.links
      .filter((link) => ehAdmin || !link.somenteAdmin)
      .map((link) => {
        const subitens = link.subitens?.map((sub) => ({ ...sub, ativo: ehLinkAtivo(pathname, sub.href) }));
        return {
          ...link,
          subitens,
          ativo: subitens ? subitens.some((s) => s.ativo) : ehLinkAtivo(pathname, link.href),
        };
      }),
  })).filter((grupo) => grupo.links.length > 0);
}

/** Título da página atual, pra topbar — procura nos links (e subitens) o que casa com a rota. */
function useTituloPagina() {
  const pathname = usePathname();
  // Um pai com subitens não é página própria (o href dele só serve pra
  // destacar a seção na sidebar) — pro título, só os subitens contam.
  const todos = GRUPOS.flatMap((g) => g.links.flatMap((l) => (l.subitens?.length ? l.subitens : [l])));
  const match = todos
    .filter((l) => ehLinkAtivo(pathname, l.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Gerenciamento";
}

export function TituloPagina() {
  return <h1 className="font-heading text-lg font-semibold">{useTituloPagina()}</h1>;
}

// Estilo do item ativo (admin-panel-ui): barra limão de 3px à esquerda +
// ícone limão, fundo sidebar-accent (já vem do data-active do botão).
function classeAtiva(ativo: boolean) {
  return cn(ativo && "border-l-[3px] border-sidebar-primary pl-[5px]");
}

// Sidebar do admin: sempre no tema escuro (preto Arena), independente do
// tema do site — por isso o `className="dark"` aqui, não no layout. Dois
// modos (aberta/trilho de ícones) vêm de graça do collapsible="icon" do
// shadcn, com o estado lembrado em cookie pelo próprio SidebarProvider.
export function GerenciamentoSidebar({ ehAdmin }: { ehAdmin: boolean }) {
  const grupos = useGrupos(ehAdmin);

  return (
    <Sidebar collapsible="icon" className="dark" style={{ top: "3.5rem", height: "calc(100svh - 3.5rem)" }}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-10 items-center justify-between gap-2 px-1">
          <Link
            href="/gerenciamento"
            className="flex min-w-0 items-center gap-2 overflow-hidden group-data-[collapsible=icon]:hidden"
          >
            <Image
              src="/logo_branca.png"
              alt="Arena JR"
              width={160}
              height={53}
              priority
              className="h-6 w-auto shrink-0"
            />
          </Link>
          <SidebarTrigger className="hidden shrink-0 md:flex" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {grupos.map((grupo, indice) => (
          <SidebarGroup key={indice}>
            {grupo.titulo && (
              <SidebarGroupLabel className="font-semibold text-sidebar-primary">
                {grupo.titulo}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.links.map((link) => {
                  const Icone = link.icon;

                  if (link.subitens) {
                    return (
                      <SidebarMenuItem key={link.href}>
                        <Collapsible defaultOpen={link.ativo} className="group/collapsible">
                          <CollapsibleTrigger
                            render={<SidebarMenuButton isActive={link.ativo} className={classeAtiva(link.ativo)} />}
                          >
                            <Icone className={cn(link.ativo && "text-sidebar-primary")} />
                            <span>{link.label}</span>
                            <ChevronRight className="ml-auto size-4 shrink-0 transition-transform group-aria-expanded/collapsible:rotate-90" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {link.subitens.map((sub) => (
                                <SidebarMenuSubItem key={sub.href}>
                                  <SidebarMenuSubButton isActive={sub.ativo} render={<Link href={sub.href} />}>
                                    {sub.label}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        isActive={link.ativo}
                        tooltip={link.label}
                        className={classeAtiva(link.ativo)}
                        render={<Link href={link.href} />}
                      >
                        <Icone className={cn(link.ativo && "text-sidebar-primary")} />
                        <span>{link.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
