"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Dois grupos: "Agenda" é a operação do dia a dia (ver reserva, criar,
// cancelar); "Quadras" e "Equipe" são configuração de baixa frequência —
// Quadras reúne cadastro, horário de funcionamento e bloqueios porque são
// as três facetas da mesma entidade (ver QuadrasNav), em vez de ficarem
// soltos no nível principal como antes.
const LINKS = [
  { href: "/gerenciamento", label: "Agenda" },
  { href: "/gerenciamento/quadras", label: "Quadras" },
  { href: "/gerenciamento/equipe", label: "Equipe" },
];

export function GerenciamentoNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do gerenciamento"
      className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4"
    >
      {LINKS.map((link) => {
        const ativo =
          link.href === "/gerenciamento"
            ? pathname === link.href
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              ativo
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
