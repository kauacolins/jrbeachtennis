"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatarDataCurtaISO, formatarDataExtensaISO } from "@/lib/datas";

// basePath: a página que recebe ?data= (agenda, day use, histórico de comandas).
export function SeletorDataAdmin({
  dataISO,
  basePath = "/gerenciamento/agenda",
}: {
  dataISO: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const selecionada = new Date(ano, mes - 1, dia);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="h-full min-w-0 flex-1 gap-2 rounded-none border-x border-x-border px-3 dark:border-x-input"
            aria-label={`Escolher data: ${formatarDataExtensaISO(dataISO)}`}
          />
        }
      >
        <CalendarIcon aria-hidden />
        {/* Por extenso não cabe ao lado das setas e do "Hoje" num celular. */}
        <span className="truncate capitalize sm:hidden">{formatarDataCurtaISO(dataISO)}</span>
        <span className="hidden capitalize sm:inline">{formatarDataExtensaISO(dataISO)}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <Calendar
          mode="single"
          selected={selecionada}
          onSelect={(data) => {
            if (!data) return;
            const iso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
            setAberto(false);
            router.push(`${basePath}?data=${iso}`);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
