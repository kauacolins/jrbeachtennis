import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/require-admin";
import { listarEventosAdmin } from "@/features/eventos/actions/listar-eventos";
import { EventosLista } from "@/components/gerenciamento/eventos/eventos-lista";

// Avisos (aula, manutenção, evento do dia...) mostrados no modal de entrada
// do site, junto com torneios de inscrição aberta.
export default async function EventosPage() {
  if (!(await exigirAdmin())) redirect("/gerenciamento");

  const eventos = await listarEventosAdmin();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
      <EventosLista eventos={eventos} />
    </div>
  );
}
