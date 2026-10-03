"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { toast } from "sonner";
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

const LINKS = [
  { href: "#modalidades", label: "Modalidades" },
  { href: "#precos", label: "Preços" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#contato", label: "Contato" },
];

function avisarLoginEmBreve() {
  toast("Login chega em breve por aqui.");
}

export function SiteHeader() {
  const [comSombra, setComSombra] = useState(false);

  useEffect(() => {
    function aoRolar() {
      setComSombra(window.scrollY > 8);
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-background transition-shadow ${
        comSombra ? "border-border shadow-sm" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-heading text-xl font-bold tracking-tight"
        >
          ARENA<span className="text-primary">JR</span>
        </Link>

        <nav
          aria-label="Seções da página"
          className="hidden items-center gap-6 md:flex"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="hidden h-11 md:inline-flex"
            onClick={avisarLoginEmBreve}
          >
            Entrar
          </Button>
          <Button
            className="h-11 px-5"
            render={<a href="#modalidades" />}
            nativeButton={false}
          >
            Reservar horário
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 md:hidden"
                />
              }
            >
              <Menu aria-hidden />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Seções da página"
                className="flex flex-col gap-1 px-4"
              >
                {LINKS.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={
                      <a
                        href={link.href}
                        className="flex h-11 items-center rounded-lg px-2 text-base font-medium hover:bg-muted"
                      />
                    }
                    nativeButton={false}
                  >
                    {link.label}
                  </SheetClose>
                ))}
                <SheetClose
                  render={
                    <button
                      type="button"
                      onClick={avisarLoginEmBreve}
                      className="flex h-11 items-center rounded-lg px-2 text-left text-base font-medium hover:bg-muted"
                    />
                  }
                >
                  Entrar
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
