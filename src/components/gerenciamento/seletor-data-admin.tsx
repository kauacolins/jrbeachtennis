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
import { formatarDataExtensaISO } from "@/lib/datas";

export function SeletorDataAdmin({ dataISO }: { dataISO: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const selecionada = new Date(ano, mes - 1, dia);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" className="gap-1.5" />}
      >
        <CalendarIcon className="size-3.5" aria-hidden />
        <span className="capitalize">{formatarDataExtensaISO(dataISO)}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selecionada}
          onSelect={(data) => {
            if (!data) return;
            const iso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
            setAberto(false);
            router.push(`/gerenciamento?data=${iso}`);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
