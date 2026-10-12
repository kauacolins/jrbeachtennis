import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adicionarDias } from "@/lib/datas";
import { SeletorDataAdmin } from "@/components/gerenciamento/seletor-data-admin";

// Dia anterior / calendário / hoje / próximo — mesmo controle da Agenda, pra
// telas que recebem ?data= (day use, histórico de comandas).
export function NavegacaoDia({
  basePath,
  dataISO,
  hojeISO,
}: {
  basePath: string;
  dataISO: string;
  hojeISO: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        render={<Link href={`${basePath}?data=${adicionarDias(dataISO, -1)}`} aria-label="Dia anterior" />}
        nativeButton={false}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <SeletorDataAdmin dataISO={dataISO} basePath={basePath} />
      {dataISO !== hojeISO && (
        <Button variant="outline" size="sm" render={<Link href={basePath} />} nativeButton={false}>
          Hoje
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        render={<Link href={`${basePath}?data=${adicionarDias(dataISO, 1)}`} aria-label="Próximo dia" />}
        nativeButton={false}
      >
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}
