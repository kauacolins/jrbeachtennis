import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Anatomia padrão dos widgets do dashboard (admin-panel-ui): Card com
// border (sem sombra), cabeçalho com ação "abrir" pra tela completa, corpo
// com rolagem própria quando passa da altura, rodapé com um botão de
// largura total. No celular o card cresce com o conteúdo em vez da altura
// fixa — rolagem dentro de rolagem é ruim de usar com o dedo.
// min-w-0: item de grid tem min-width auto, então um nome comprido (mesmo
// com truncate) alargava a coluna além da linha dos KPIs.
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
    <div className={cn("flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 md:h-96", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading font-semibold">{titulo}</h3>
        {href && (
          <Link
            href={href}
            aria-label={`Abrir ${titulo}`}
            className="-m-2 flex size-10 items-center justify-center text-muted-foreground hover:text-foreground md:m-0 md:size-auto"
          >
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      {acoes}
      <div className="min-h-0 flex-1 md:overflow-y-auto">{children}</div>
      {footer}
    </div>
  );
}

export function WidgetVazio({ texto }: { texto: string }) {
  return (
    <p className="flex h-full items-center justify-center py-6 text-center text-sm text-muted-foreground md:py-0">
      {texto}
    </p>
  );
}
