"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthStatus } from "@/components/auth/auth-status";

// Header das páginas "de app" (reserva, minhas reservas, perfil, como
// funciona, contato) — diferente do SiteHeader da landing, que navega por
// âncoras de seção. Aqui são só rotas reais.
const LINKS = [
  { href: "/minhas-reservas", label: "Minhas reservas" },
  { href: "/perfil", label: "Meu perfil" },
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeaderApp() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center rounded-md bg-white p-1">
          <Image
            src="/logo.png"
            alt="Arena JR"
            width={240}
            height={80}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="hidden md:block">
            <AuthStatus />
          </div>

          <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="h-11 w-11 md:hidden" />
              }
            >
              <Menu aria-hidden />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navegação" className="flex flex-col gap-1 px-4">
                {LINKS.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={
                      <Link
                        href={link.href}
                        className="flex h-11 items-center rounded-lg px-2 text-base font-medium hover:bg-muted"
                      />
                    }
                    nativeButton={false}
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </nav>
              <div className="border-t px-4 pt-4">
                <AuthStatus />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
