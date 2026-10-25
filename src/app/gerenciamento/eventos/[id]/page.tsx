import { notFound, redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/require-admin";
import { obterEventoAdmin } from "@/features/eventos/actions/listar-eventos";
import { valoresDoEvento } from "@/features/eventos/modelos";
import { EventoForm } from "@/components/gerenciamento/eventos/evento-form";

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await exigirAdmin())) redirect("/gerenciamento");

  const { id } = await params;
  const evento = await obterEventoAdmin(id);
  if (!evento) notFound();

  return <EventoForm evento={evento} valoresIniciais={valoresDoEvento(evento)} />;
}
