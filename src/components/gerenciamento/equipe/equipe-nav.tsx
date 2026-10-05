"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/gerenciamento/equipe", label: "Equipe" },
  { href: "/gerenciamento/equipe/clientes", label: "Clientes" },
];

// "Equipe" é quem tem acesso ao /gerenciamento (admin/operador/instrutor);
// "Clientes" é quem só reserva — cadastro público em /entrar, sem acesso
// aqui. Junto porque as duas telas são "gerenciar uma conta de usuário",
// só que com formulários e permissões bem diferentes (ver UsuarioForm vs
// ClienteForm).
export function EquipeNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Equipe"
      className="flex gap-1 overflow-x-auto sm:w-48 sm:shrink-0 sm:flex-col sm:gap-0.5"
    >
      {LINKS.map((link) => {
        const ativo =
          link.href === "/gerenciamento/equipe"
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
