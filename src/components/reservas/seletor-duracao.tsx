"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DURACAO_MINIMA_MIN, PASSO_RESERVA_MIN } from "@/lib/constants";
import { formatarDuracao } from "@/lib/format";

export function SeletorDuracao({
  duracaoMaxima,
  valor,
  onChange,
}: {
  duracaoMaxima: number;
  valor: number;
  onChange: (duracao: number) => void;
}) {
  // duracaoMaxima em minutos: 1h, 1h30, 2h... até o que cabe livre.
  const opcoes: number[] = [];
  for (let m = DURACAO_MINIMA_MIN; m <= duracaoMaxima; m += PASSO_RESERVA_MIN) {
    opcoes.push(m);
  }

  return (
    <ToggleGroup
      value={[String(valor)]}
      onValueChange={(valores) => {
        const nova = valores[0];
        if (nova) onChange(Number(nova));
      }}
      aria-label="Duração da reserva"
      variant="outline"
      size="lg"
    >
      {opcoes.map((minutos) => (
        <ToggleGroupItem key={minutos} value={String(minutos)}>
          {formatarDuracao(minutos)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
