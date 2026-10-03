"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function SeletorDuracao({
  duracaoMaxima,
  valor,
  onChange,
}: {
  duracaoMaxima: number;
  valor: number;
  onChange: (duracao: number) => void;
}) {
  const opcoes = Array.from({ length: duracaoMaxima }, (_, i) => i + 1);

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
      {opcoes.map((horas) => (
        <ToggleGroupItem key={horas} value={String(horas)}>
          {horas}h
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
