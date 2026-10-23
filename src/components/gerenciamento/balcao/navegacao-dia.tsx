import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adicionarDias } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { SeletorDataAdmin } from "@/components/gerenciamento/seletor-data-admin";

// Dia anterior / calendário / próximo + "Hoje" — mesmo controle em toda tela
// que recebe ?data= (agenda, day use, histórico de comandas). No celular
// ocupa a linha inteira, com alvos de toque de 40px; as setas e a data ficam
// num bloco só pra não parecerem três botões soltos.
export function NavegacaoDia({
  basePath,
  dataISO,
  hojeISO,
  className,
}: {
  basePath: string;
  dataISO: string;
  hojeISO: string;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full items-center gap-2 sm:w-auto", className)}>
      <div className="flex h-10 min-w-0 flex-1 items-center rounded-lg border bg-background sm:h-9 sm:flex-none dark:border-input dark:bg-input/30">
        <Button
          variant="ghost"
          className="h-full w-10 rounded-r-none sm:w-9"
          render={<Link href={`${basePath}?data=${adicionarDias(dataISO, -1)}`} aria-label="Dia anterior" />}
          nativeButton={false}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <SeletorDataAdmin dataISO={dataISO} basePath={basePath} />
        <Button
          variant="ghost"
          className="h-full w-10 rounded-l-none sm:w-9"
          render={<Link href={`${basePath}?data=${adicionarDias(dataISO, 1)}`} aria-label="Próximo dia" />}
          nativeButton={false}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
      {dataISO !== hojeISO && (
        <Button
          variant="outline"
          className="h-10 px-3 sm:h-9"
          render={<Link href={basePath} />}
          nativeButton={false}
        >
          Hoje
        </Button>
      )}
    </div>
  );
}
