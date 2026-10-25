import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetCard } from "@/components/gerenciamento/dashboard/widget-card";
import { SugestoesEvento } from "@/components/gerenciamento/eventos/sugestoes-evento";

// Dashboard, widget "Avisos no site": atalho pra publicar no modal de
// entrada do site um aviso do dia (day use, aula, manutenção...) sem
// precisar escrever do zero.
export function WidgetAvisos() {
  return (
    <WidgetCard
      titulo="Avisos no site"
      href="/gerenciamento/eventos"
      footer={
        <Button
          variant="outline"
          className="h-11 w-full"
          nativeButton={false}
          render={<Link href="/gerenciamento/eventos/novo" />}
        >
          <Plus aria-hidden />
          Aviso em branco
        </Button>
      }
    >
      <SugestoesEvento compacto />
    </WidgetCard>
  );
}
