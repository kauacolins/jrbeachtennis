"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/gerenciamento/comandas/pedido", label: "Pedido" },
  { href: "/gerenciamento/comandas", label: "Abertas" },
  { href: "/gerenciamento/comandas/historico", label: "Histórico" },
];

export function ComandasNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Comandas" className="flex gap-1">
      {LINKS.map((link) => {
        const ativo = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex h-11 items-center rounded-lg px-4 text-base font-medium transition-colors",
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
