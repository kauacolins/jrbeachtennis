import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODELOS_EVENTO, hrefModeloEvento } from "@/features/eventos/modelos";

// Atalhos pra criar um aviso a partir de um modelo pronto (ver
// MODELOS_EVENTO). `compacto` é a versão em lista do widget do dashboard;
// sem ele vira a grade de cards da tela de Eventos.
export function SugestoesEvento({ compacto = false }: { compacto?: boolean }) {
  return (
    <ul className={cn(compacto ? "flex flex-col gap-1" : "grid gap-2 sm:grid-cols-2 lg:grid-cols-4")}>
      {MODELOS_EVENTO.map((modelo) => {
        const Icone = modelo.icone;
        return (
          <li key={modelo.id}>
            <Link
              href={hrefModeloEvento(modelo)}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                compacto ? "py-2 pr-1 max-md:min-h-12" : "h-full border bg-background p-3"
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icone className="size-4" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{modelo.nome}</span>
                {!compacto && <span className="text-xs text-muted-foreground">{modelo.descricao}</span>}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
