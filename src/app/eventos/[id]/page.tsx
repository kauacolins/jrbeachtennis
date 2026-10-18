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
    // Mesmo layout da página do torneio: imagem vertical (4:5) em cima no
    // celular e ao lado do texto no desktop.
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-6 pb-10 md:flex-row md:items-start md:gap-10 md:pt-10">
      {evento.imagemUrl && (
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm shrink-0 overflow-hidden rounded-xl bg-muted md:mx-0 md:w-72">
          <Image
            src={evento.imagemUrl}
            alt={evento.titulo}
            fill
            priority
            sizes="(min-width: 768px) 288px, (min-width: 384px) 384px, 100vw"
            unoptimized
            className="object-cover"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
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
