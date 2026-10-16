import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Anatomia padrão dos widgets do dashboard (admin-panel-ui): Card com
// border (sem sombra), cabeçalho com ação "abrir" pra tela completa, corpo
// com rolagem própria quando passa da altura, rodapé com um botão de
// largura total.
export function WidgetCard({
  titulo,
  href,
  acoes,
  footer,
  className,
  children,
}: {
  titulo: string;
  href?: string;
  acoes?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex h-96 flex-col gap-3 rounded-xl border bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading font-semibold">{titulo}</h3>
        {href && (
          <Link
            href={href}
            aria-label={`Abrir ${titulo}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      {acoes}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer}
    </div>
  );
}

export function WidgetVazio({ texto }: { texto: string }) {
  return (
    <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
      {texto}
    </p>
  );
}
