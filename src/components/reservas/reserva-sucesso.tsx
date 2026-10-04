"use client";

import Link from "next/link";
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
  reservaId,
  modalidadeNome,
  inicioISO,
  fimISO,
  valorCentavos,
  logado,
  onReservarOutra,
}: {
  reservaId: string;
  modalidadeNome: string;
  inicioISO: string;
  fimISO: string;
  valorCentavos: number;
  logado: boolean;
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
    <div className="flex flex-col items-center gap-4 pt-2 text-center">
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
      <div className="flex w-full flex-col gap-2">
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

      {logado && (
        <Button
          variant="ghost"
          className="h-11"
          render={<Link href="/minhas-reservas" />}
          nativeButton={false}
        >
          Ver minhas reservas
        </Button>
      )}

      {!logado && (
        <div className="mt-2 flex w-full flex-col gap-2 rounded-lg bg-accent px-4 py-3 text-accent-foreground">
          <p className="text-sm font-medium">
            Quer acompanhar essa reserva?
          </p>
          <p className="text-sm">
            Entre ou crie uma conta e a gente liga essa reserva a ela.
          </p>
          <Button
            variant="outline"
            className="h-11 self-center bg-background"
            render={<Link href={`/entrar?reserva=${reservaId}`} />}
            nativeButton={false}
          >
            Entrar ou criar conta
          </Button>
        </div>
      )}
    </div>
  );
}
