"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface LinkNav {
  href: string;
  label: string;
  somenteAdmin?: boolean;
}

// Início isolado e depois dois grupos: operação do dia a dia (o balcão) e
// configuração de baixa frequência. Produtos e Torneios mexem em preço, só
// aparecem pro ADMIN (ver exigirSomenteAdmin).
const GRUPOS: { titulo?: string; links: LinkNav[] }[] = [
  { links: [{ href: "/gerenciamento", label: "Início" }] },
  {
    titulo: "Operação",
    links: [
      { href: "/gerenciamento/agenda", label: "Agenda" },
      { href: "/gerenciamento/comandas", label: "Comandas" },
      { href: "/gerenciamento/day-use", label: "Day use" },
      { href: "/gerenciamento/planos", label: "Planos" },
    ],
  },
  {
    titulo: "Configuração",
    links: [
      { href: "/gerenciamento/quadras", label: "Quadras" },
      { href: "/gerenciamento/produtos", label: "Produtos", somenteAdmin: true },
      { href: "/gerenciamento/torneios", label: "Torneios", somenteAdmin: true },
      { href: "/gerenciamento/eventos", label: "Eventos" },
      { href: "/gerenciamento/equipe", label: "Equipe" },
    ],
  },
];

function ehLinkAtivo(pathname: string, href: string) {
  return href === "/gerenciamento" ? pathname === href : pathname.startsWith(href);
}

// Sidebar do admin (componente Sidebar do shadcn/ui): fica abaixo do
// cabeçalho fixo, que sobrepõe sua borda superior (ver GerenciamentoLayout —
// top-14 + altura ajustada). No celular vira gaveta, aberta pelo
// SidebarTrigger do cabeçalho. "Operação" e "Configuração" em verde pra
// separar visualmente os grupos.
export function GerenciamentoSidebar({ ehAdmin }: { ehAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <Sidebar style={{ top: "3.5rem", height: "calc(100svh - 3.5rem)" }}>
      <SidebarContent>
        {GRUPOS.map((grupo, indice) => {
          const links = grupo.links.filter((link) => ehAdmin || !link.somenteAdmin);
          if (links.length === 0) return null;
          return (
            <SidebarGroup key={indice}>
              {indice > 0 && <SidebarSeparator className="mb-2" />}
              {grupo.titulo && (
                <SidebarGroupLabel className="font-semibold text-sidebar-primary-foreground">
                  {grupo.titulo}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {links.map((link) => (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton isActive={ehLinkAtivo(pathname, link.href)} render={<Link href={link.href} />}>
                        {link.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
