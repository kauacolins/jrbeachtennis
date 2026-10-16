import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { obterEventoPublico } from "@/features/eventos/actions/obter-evento-publico";
import { formatarDataLonga, formatarHora } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const evento = await obterEventoPublico(id);
  if (!evento) return {};
  return {
    title: `${evento.titulo} | Arena JR`,
    description: evento.descricao ?? undefined,
  };
}

export default async function EventoPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evento = await obterEventoPublico(id);
  if (!evento) notFound();

  return (
    <div className="flex flex-col gap-6 pb-10">
      {evento.imagemUrl && (
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-muted">
          <Image
            src={evento.imagemUrl}
            alt={evento.titulo}
            fill
            priority
            sizes="100vw"
            unoptimized
            className="object-cover"
          />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{evento.titulo}</h1>
        {evento.data && (
          <p className="text-sm text-muted-foreground">
            {formatarDataLonga(evento.data)} às {formatarHora(evento.data)}
          </p>
        )}
        {evento.descricao && <p className="text-sm whitespace-pre-wrap">{evento.descricao}</p>}
      </div>
    </div>
  );
}
