"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/gerenciamento/quadras", label: "Quadras" },
  { href: "/gerenciamento/quadras/horarios", label: "Horários" },
  { href: "/gerenciamento/quadras/bloqueios", label: "Bloqueios" },
];

// RF10/RF11/RF12 vivem juntos aqui: são as três facetas de como uma quadra
// fica disponível pra reserva (quais modalidades e preço, quando abre, e
// quais horários pontuais ficam de fora) — por isso andam lado a lado em
// vez de espalhados pela navegação principal.
export function QuadrasNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Quadras"
      className="flex gap-1 overflow-x-auto sm:w-48 sm:shrink-0 sm:flex-col sm:gap-0.5"
    >
      {LINKS.map((link) => {
        const ativo =
          link.href === "/gerenciamento/quadras"
            ? pathname === link.href
            : pathname.startsWith(link.href);
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
