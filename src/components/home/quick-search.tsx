"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JANELA_MAXIMA_DIAS } from "@/lib/constants";
import { dataParaISO, formatarDataCurta } from "@/lib/format";

const hoje = new Date();
const limiteFuturo = new Date(
  hoje.getTime() + JANELA_MAXIMA_DIAS * 24 * 60 * 60_000
);

export function QuickSearch({
  modalidades,
}: {
  modalidades: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [modalidadeId, setModalidadeId] = useState(modalidades[0]?.id ?? "");
  const [data, setData] = useState<Date | undefined>(undefined);

  // Sem isso, o Select mostra o id bruto no lugar do nome da modalidade.
  const itensModalidade = useMemo(
    () => Object.fromEntries(modalidades.map((m) => [m.id, m.nome])),
    [modalidades]
  );

  function buscar() {
    if (!modalidadeId) return;
    const params = new URLSearchParams();
    if (data) params.set("data", dataParaISO(data));
    const query = params.toString();
    router.push(`/reservar/${modalidadeId}${query ? `?${query}` : ""}`);
  }

  return (
    <div className="rounded-xl bg-card p-3 text-card-foreground shadow-lg ring-1 ring-foreground/10 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          items={itensModalidade}
          value={modalidadeId}
          onValueChange={(value) => value && setModalidadeId(value)}
        >
          <SelectTrigger className="h-11 w-full sm:flex-1">
            <SelectValue placeholder="Modalidade" />
          </SelectTrigger>
          <SelectContent>
            {modalidades.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="h-11 w-full justify-start font-normal sm:flex-1"
              />
            }
          >
            <CalendarIcon className="text-muted-foreground" aria-hidden />
            {data ? formatarDataCurta(data) : "Hoje"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={data}
              onSelect={setData}
              disabled={[{ before: hoje }, { after: limiteFuturo }]}
            />
          </PopoverContent>
        </Popover>

        <Button
          className="h-11 px-6"
          onClick={buscar}
          disabled={!modalidadeId}
        >
          <Search aria-hidden />
          Ver horários
        </Button>
      </div>
    </div>
  );
}
