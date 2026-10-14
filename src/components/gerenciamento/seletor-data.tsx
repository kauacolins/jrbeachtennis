"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function paraISO(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function isoParaData(dataISO: string) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarDiaCurto(data: Date) {
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}

// Botão + calendário (mesmo padrão do SeletorDataAdmin, só que pra um campo
// de formulário em vez de navegação por URL): escolhe um dia "yyyy-MM-dd".
// Usado em qualquer tela que hoje pediria <input type="date">.
export function SeletorData({
  valor,
  onAlterar,
  placeholder = "Escolha a data",
  ariaLabel,
  className,
  disabled,
}: {
  valor: string;
  onAlterar: (dataISO: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const selecionada = valor ? isoParaData(valor) : undefined;

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn("h-11 justify-start gap-2", className)}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0" aria-hidden />
        {selecionada ? formatarDiaCurto(selecionada) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selecionada}
          onSelect={(data) => {
            if (!data) return;
            onAlterar(paraISO(data));
            setAberto(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
