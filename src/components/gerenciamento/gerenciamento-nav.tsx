"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SairEquipe } from "@/components/auth/sair-equipe";

// Início (atalhos) e depois dois grupos: operação do dia a dia (Agenda, Comandas, Day use, Planos —
// o balcão) e configuração de baixa frequência (Quadras, Produtos, Equipe).
// Quadras reúne cadastro, horário de funcionamento e bloqueios porque são
// as três facetas da mesma entidade (ver QuadrasNav). Produtos mexe em
// preço, então só aparece pro ADMIN (ver exigirSomenteAdmin).
const LINKS = [
  { href: "/gerenciamento", label: "Início" },
  { href: "/gerenciamento/agenda", label: "Agenda" },
  { href: "/gerenciamento/comandas", label: "Comandas" },
  { href: "/gerenciamento/day-use", label: "Day use" },
  { href: "/gerenciamento/planos", label: "Planos" },
  { href: "/gerenciamento/quadras", label: "Quadras" },
  { href: "/gerenciamento/produtos", label: "Produtos", somenteAdmin: true },
  { href: "/gerenciamento/equipe", label: "Equipe" },
];

function useLinks(ehAdmin: boolean) {
  const pathname = usePathname();
  return LINKS.filter((link) => ehAdmin || !link.somenteAdmin).map((link) => ({
    ...link,
    ativo:
      link.href === "/gerenciamento"
        ? pathname === link.href
        : pathname.startsWith(link.href),
  }));
}

// Abas abaixo do cabeçalho — só a partir do md; no celular a navegação fica
// no menu hambúrguer (GerenciamentoMenuMobile).
export function GerenciamentoNav({ ehAdmin }: { ehAdmin: boolean }) {
  const links = useLinks(ehAdmin);

  return (
    <nav
      aria-label="Navegação do gerenciamento"
      className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-4 md:flex"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.ativo ? "page" : undefined}
          className={cn(
            "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            link.ativo
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function GerenciamentoMenuMobile({ ehAdmin }: { ehAdmin: boolean }) {
  const links = useLinks(ehAdmin);
  const [aberto, setAberto] = useState(false);

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="h-11 w-11 md:hidden" />}
      >
        <Menu aria-hidden />
        <span className="sr-only">Abrir menu</span>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Navegação do gerenciamento" className="flex flex-col gap-1 px-4">
          {links.map((link) => (
            <SheetClose
              key={link.href}
              render={
                <Link
                  href={link.href}
                  aria-current={link.ativo ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center rounded-lg px-2 text-base font-medium hover:bg-muted",
                    link.ativo && "bg-muted text-primary"
                  )}
                />
              }
              nativeButton={false}
            >
              {link.label}
            </SheetClose>
          ))}
        </nav>
        <div className="border-t px-4 pt-4">
          <SairEquipe className="w-full justify-start px-2" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
