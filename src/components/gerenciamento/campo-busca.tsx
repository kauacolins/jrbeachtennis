"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Campo de busca das listagens do gerenciamento (filtra no navegador, junto
// com filtrarPorBusca de @/lib/busca).
export function CampoBusca({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:max-w-sm", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        className="h-11 pl-9"
      />
    </div>
  );
}

// Mensagem quando a busca não encontra nada na lista (que não está vazia).
export function SemResultadoBusca({ busca }: { busca: string }) {
  return (
    <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground" aria-live="polite">
      Nada encontrado para &quot;{busca.trim()}&quot;.
    </p>
  );
}
