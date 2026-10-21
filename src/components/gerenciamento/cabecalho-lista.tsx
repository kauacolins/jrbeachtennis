import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Cabeçalho padrão das telas de listagem (Quadras, Clientes, Equipe,
// Produtos, Eventos, Torneios, Planos). O título já aparece na topbar
// (TituloPagina, ver gerenciamento-nav) a partir de md: — repeti-lo aqui
// como h1 criava duas manchetes idênticas na mesma tela e deixava toda
// listagem com a cara do mesmo molde. No mobile a topbar não mostra
// título (sem espaço com o menu), então ele some só em telas maiores.
//
// `secao` é pra cabeçalho de bloco dentro de uma página maior (ex.: "Bar"
// em Produtos, "Categorias" num torneio) — não duplica a topbar, então o
// título fica sempre visível, em h2.
export function CabecalhoLista({
  titulo,
  contagem,
  acao,
  secao = false,
}: {
  titulo: string;
  contagem?: string;
  acao?: ReactNode;
  secao?: boolean;
}) {
  const Titulo = secao ? "h2" : "h1";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <Titulo
          className={cn(
            "font-heading font-bold",
            secao ? "text-lg" : "text-xl md:hidden"
          )}
        >
          {titulo}
        </Titulo>
        {contagem && <p className="text-sm text-muted-foreground">{contagem}</p>}
      </div>
      {acao}
    </div>
  );
}
