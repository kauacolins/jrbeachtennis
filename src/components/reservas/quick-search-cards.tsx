"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { JANELA_MAXIMA_DIAS } from "@/lib/constants";
import { dataParaISO, formatarDataCurta } from "@/lib/format";
import { FOTO_POR_MODALIDADE } from "@/lib/mock-data";

const hoje = new Date();
const limiteFuturo = new Date(
  hoje.getTime() + JANELA_MAXIMA_DIAS * 24 * 60 * 60_000
);

export function QuickSearchCards({
  modalidades,
}: {
  modalidades: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [data, setData] = useState<Date | undefined>(undefined);

  function irParaModalidade(modalidadeId: string) {
    const params = new URLSearchParams();
    if (data) params.set("data", dataParaISO(data));
    const query = params.toString();
    router.push(`/reservar/${modalidadeId}${query ? `?${query}` : ""}`);
  }

  return (
    <div className="rounded-xl bg-card p-3 text-card-foreground shadow-lg ring-1 ring-foreground/10 sm:p-4">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="h-11 w-full justify-start font-normal"
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

      <p className="mt-3 text-xs font-medium text-muted-foreground">
        Escolha a modalidade
      </p>
      <div className="mt-2 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {modalidades.map((modalidade) => {
          const foto = FOTO_POR_MODALIDADE[modalidade.nome.toLowerCase()];
          return (
            <button
              key={modalidade.id}
              type="button"
              onClick={() => irParaModalidade(modalidade.id)}
              className="group relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {foto ? (
                <Image
                  src={foto}
                  alt={modalidade.nome}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-brand-black/10 to-transparent"
                aria-hidden
              />
              <span className="absolute inset-x-0 bottom-1 px-1 text-center text-[11px] font-semibold leading-tight text-brand-black-foreground">
                {modalidade.nome}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
