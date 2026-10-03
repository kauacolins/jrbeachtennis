"use client";

import { CalendarPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarDataLonga, formatarHora, formatarPreco } from "@/lib/format";

function gerarIcs(modalidadeNome: string, inicioISO: string, fimISO: string) {
  const paraIcsData = (iso: string) =>
    iso.replace(/[-:]/g, "").split(".")[0] + "Z";

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${paraIcsData(inicioISO)}`,
    `DTEND:${paraIcsData(fimISO)}`,
    `SUMMARY:Reserva - ${modalidadeNome}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return linhas.join("\r\n");
}

export function ReservaSucesso({
  modalidadeNome,
  inicioISO,
  fimISO,
  valorCentavos,
  onReservarOutra,
}: {
  modalidadeNome: string;
  inicioISO: string;
  fimISO: string;
  valorCentavos: number;
  onReservarOutra: () => void;
}) {
  function adicionarAoCalendario() {
    const ics = gerarIcs(modalidadeNome, inicioISO, fimISO);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reserva.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-card px-4 py-8 text-center">
      <CheckCircle2 className="size-10 text-primary" aria-hidden />
      <div>
        <h3 className="text-lg font-semibold">Reserva confirmada!</h3>
        <p className="text-sm text-muted-foreground">
          {modalidadeNome} · <span className="capitalize">{formatarDataLonga(inicioISO)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {formatarHora(inicioISO)} às {formatarHora(fimISO)} ·{" "}
          {formatarPreco(valorCentavos)}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button
          variant="outline"
          className="h-11"
          onClick={adicionarAoCalendario}
        >
          <CalendarPlus aria-hidden />
          Adicionar ao calendário
        </Button>
        <Button className="h-11" onClick={onReservarOutra}>
          Reservar outro horário
        </Button>
      </div>
    </div>
  );
}
