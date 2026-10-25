"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { SairEquipe } from "@/components/auth/sair-equipe";
import { ThemeToggle } from "@/components/theme-toggle";

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
// Eventos (torneios e avisos do site) e Configuração (baixa frequência). Quadras, horários e
// bloqueios ficam juntos como subitens: são as três facetas de como uma
// quadra fica disponível pra reserva (RF10/RF11/RF12).
const GRUPOS: { titulo?: string; links: LinkNav[] }[] = [
  {
    titulo: "Principal",
    links: [
      { href: "/gerenciamento", label: "Dashboard", icon: LayoutDashboard },
      { href: "/gerenciamento/agenda", label: "Agenda", icon: CalendarDays },
      { href: "/gerenciamento/comandas", label: "Comandas", icon: Receipt },
      { href: "/gerenciamento/day-use", label: "Day use", icon: Ticket },
    ],
  },
  {
    titulo: "Clientes",
    links: [
      { href: "/gerenciamento/clientes", label: "Clientes", icon: Users },
      { href: "/gerenciamento/planos", label: "Mensalistas", icon: UserRound },
    ],
  },
  {
    titulo: "Eventos",
    links: [
      { href: "/gerenciamento/torneios", label: "Torneios", icon: Trophy, somenteAdmin: true },
      { href: "/gerenciamento/eventos", label: "Avisos do site", icon: Megaphone },
    ],
  },
  {
    titulo: "Configuração",
    links: [
      {
        href: "/gerenciamento/quadras",
        label: "Quadras e horários",
        icon: LandPlot,
        subitens: [
          { href: "/gerenciamento/quadras", label: "Quadras" },
          { href: "/gerenciamento/quadras/horarios", label: "Horários" },
          { href: "/gerenciamento/quadras/bloqueios", label: "Bloqueios" },
        ],
      },
      { href: "/gerenciamento/produtos", label: "Produtos e preços", icon: Package, somenteAdmin: true },
      { href: "/gerenciamento/equipe", label: "Equipe", icon: UsersRound },
    ],
  },
];

// Páginas de verdade do menu — um pai com subitens não é página própria (o
// href dele só serve pra destacar a seção na sidebar), só os subitens contam.
const PAGINAS = GRUPOS.flatMap((g) => g.links.flatMap((l) => (l.subitens?.length ? l.subitens : [l])));

// Só a página mais específica que casa com a rota fica ativa — senão
// /quadras/bloqueios acenderia também "Quadras e horários" (/quadras).
function paginaAtual(pathname: string) {
  return PAGINAS.filter((p) =>
    p.href === "/gerenciamento" ? pathname === p.href : pathname === p.href || pathname.startsWith(`${p.href}/`)
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

function ehLinkAtivo(pathname: string, href: string) {
  return paginaAtual(pathname)?.href === href;
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
  return paginaAtual(usePathname())?.label ?? "Gerenciamento";
}

export function TituloPagina() {
  return <h1 className="font-heading text-lg font-semibold">{useTituloPagina()}</h1>;
}

// Estilo dos itens (admin-panel-ui): cantos retos; o ativo ganha barra de
// 3px à esquerda + ícone na cor sidebar-primary (preto no tema claro, limão
// no escuro), fundo sidebar-accent (já vem do data-active do botão).
// No celular (gaveta) os itens crescem pra 44px — os 32px do desktop são
// pequenos demais pro dedo.
function classeItem(ativo: boolean, mobile: boolean) {
  return cn(
    "rounded-none",
    mobile && "h-11 gap-3 px-3 text-[15px] [&_svg]:size-5",
    ativo && (mobile ? "border-l-[3px] border-sidebar-primary pl-[9px]" : "border-l-[3px] border-sidebar-primary pl-[5px]")
  );
}

// Contagem que pede ação (ver obterContagensMenu); zero não aparece.
function BadgeContagem({ quantidade }: { quantidade?: number }) {
  if (!quantidade) return null;
  return (
    <SidebarMenuBadge className="top-1/2! -translate-y-1/2 rounded-full bg-warning px-1.5 text-[11px] text-warning-foreground!">
      {quantidade > 99 ? "99+" : quantidade}
    </SidebarMenuBadge>
  );
}

// Atalhos do celular (admin-panel-ui): Dashboard, Agenda, Comandas e Day
// use numa barra fixa embaixo, ao alcance do polegar — o resto do menu
// continua na gaveta.
const ATALHOS_INFERIORES = GRUPOS[0].links;

export function BarraInferiorMobile({ contagens }: { contagens: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Atalhos"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {ATALHOS_INFERIORES.map((link) => {
        const Icone = link.icon;
        const ativo = ehLinkAtivo(pathname, link.href);
        const quantidade = contagens[link.href];
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "relative flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors focus-visible:bg-muted focus-visible:outline-none",
              ativo ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {ativo && <span className="absolute inset-x-4 top-0 h-[3px] bg-sidebar-primary" aria-hidden />}
            <span className="relative">
              <Icone className={cn("size-5", ativo && "text-sidebar-primary")} aria-hidden />
              {quantidade ? (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-semibold text-warning-foreground tabular-nums">
                  {quantidade > 99 ? "99+" : quantidade}
                </span>
              ) : null}
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Sidebar do admin: segue o tema do site pelos tokens `sidebar` (claro
// #F8FAF6, escuro #0A0D10 preto Arena). Dois modos (aberta/trilho de
// ícones) vêm de graça do collapsible="icon" do shadcn, com o estado
// lembrado em cookie pelo próprio SidebarProvider.
export function GerenciamentoSidebar({
  ehAdmin,
  nome,
  contagens,
}: {
  ehAdmin: boolean;
  nome: string;
  contagens: Record<string, number>;
}) {
  const grupos = useGrupos(ehAdmin);
  const { isMobile, setOpenMobile } = useSidebar();
  // Na gaveta do celular, tocar num link fecha o menu — senão a página nova
  // carrega escondida atrás dele.
  const fecharNoMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    // Abaixo do header fixo, que tem 64px no celular e 56px a partir de md.
    <Sidebar
      collapsible="icon"
      className="top-16! h-[calc(100svh-4rem)]! md:top-14! md:h-[calc(100svh-3.5rem)]!"
    >
      {/* No celular a gaveta abre abaixo do header fixo, que já mostra a
          logo e o botão do menu — repetir aqui duplicava a logo. */}
      {!isMobile && (
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex h-10 items-center justify-between gap-2 px-1">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 overflow-hidden group-data-[collapsible=icon]:hidden"
            >
              <Image
                src="/logo.png"
                alt="Arena JR"
                width={160}
                height={53}
                priority
                className="h-6 w-auto shrink-0 dark:hidden"
              />
              <Image
                src="/logo_branca.png"
                alt="Arena JR"
                width={160}
                height={53}
                priority
                className="hidden h-6 w-auto shrink-0 dark:block"
              />
            </Link>
            <SidebarTrigger className="hidden shrink-0 md:flex" />
          </div>
        </SidebarHeader>
      )}

      <SidebarContent>
        {grupos.map((grupo, indice) => (
          <SidebarGroup key={indice} className={cn(isMobile && "py-1")}>
            {grupo.titulo && (
              <SidebarGroupLabel className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {grupo.titulo}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className={cn(isMobile && "gap-1")}>
                {grupo.links.map((link) => {
                  const Icone = link.icon;

                  if (link.subitens) {
                    return (
                      <SidebarMenuItem key={link.href}>
                        <Collapsible defaultOpen={link.ativo} className="group/collapsible">
                          <CollapsibleTrigger
                            render={
                              <SidebarMenuButton isActive={link.ativo} className={classeItem(link.ativo, isMobile)} />
                            }
                          >
                            <Icone className={cn(link.ativo && "text-sidebar-primary")} />
                            <span>{link.label}</span>
                            <ChevronRight className="ml-auto size-4! shrink-0 transition-transform group-aria-expanded/collapsible:rotate-90" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className={cn(isMobile && "mx-5 gap-1 py-1")}>
                              {link.subitens.map((sub) => (
                                <SidebarMenuSubItem key={sub.href}>
                                  <SidebarMenuSubButton
                                    isActive={sub.ativo}
                                    className={cn("rounded-none", isMobile && "h-10 px-3 text-[15px]")}
                                    render={<Link href={sub.href} onClick={fecharNoMobile} />}
                                  >
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
                        className={classeItem(link.ativo, isMobile)}
                        render={<Link href={link.href} onClick={fecharNoMobile} />}
                      >
                        <Icone className={cn(link.ativo && "text-sidebar-primary")} />
                        <span>{link.label}</span>
                      </SidebarMenuButton>
                      <BadgeContagem quantidade={contagens[link.href]} />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* No celular o header só tem espaço pro menu, logo e Venda rápida —
          tema e sair moram aqui no rodapé da gaveta. */}
      {isMobile && (
        <SidebarFooter className="flex-row items-center justify-between border-t border-sidebar-border">
          <SairEquipe nome={nome} />
          <ThemeToggle />
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
