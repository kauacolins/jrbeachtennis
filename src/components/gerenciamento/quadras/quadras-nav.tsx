"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/gerenciamento/configuracoes/quadras", label: "Quadras" },
  { href: "/gerenciamento/configuracoes/usuarios", label: "Usuários" },
];

export function ConfiguracoesNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Configurações"
      className="flex gap-1 overflow-x-auto sm:w-48 sm:shrink-0 sm:flex-col sm:gap-0.5"
    >
      {LINKS.map((link) => {
        const ativo = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              ativo
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
