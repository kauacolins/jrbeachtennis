import type { Metadata } from "next";
import { Camera, MapPin, MessageCircle } from "lucide-react";
import { obterHorarioGeral } from "@/features/quadras/actions/obter-horario-geral";

export const metadata: Metadata = {
  title: "Contato | Arena JR",
  description: "Endereço, horário de funcionamento e contato da Arena JR.",
};

export default async function ContatoPage() {
  const horario = await obterHorarioGeral();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Contato
      </h1>

      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 text-brand-text" aria-hidden />
          <div>
            <p className="font-medium">Endereço</p>
            {/* TODO: endereço completo da arena */}
            <p className="text-sm text-muted-foreground">
              Brejo do Cruz, PB
            </p>
          </div>
        </div>

        {horario && (
          <div className="flex items-start gap-3">
            <MessageCircle
              className="mt-0.5 size-5 text-brand-text"
              aria-hidden
            />
            <div>
              <p className="font-medium">Horário de funcionamento</p>
              <p className="text-sm text-muted-foreground">{horario}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        {/* TODO: link real do WhatsApp */}
        <a
          href="#"
          className="flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
        >
          <MessageCircle className="size-4" aria-hidden />
          WhatsApp
        </a>
        {/* TODO: link real do Instagram */}
        <a
          href="#"
          className="flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
        >
          <Camera className="size-4" aria-hidden />
          Instagram
        </a>
      </div>
    </div>
  );
}
