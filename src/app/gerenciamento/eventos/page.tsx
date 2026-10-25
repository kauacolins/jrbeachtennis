import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/require-admin";
import { listarEventosAdmin } from "@/features/eventos/actions/listar-eventos";
import { EventosLista } from "@/components/gerenciamento/eventos/eventos-lista";
import { SugestoesEvento } from "@/components/gerenciamento/eventos/sugestoes-evento";

// Avisos (aula, manutenção, evento do dia...) mostrados no modal de entrada
// do site, junto com torneios de inscrição aberta.
export default async function EventosPage() {
  if (!(await exigirAdmin())) redirect("/gerenciamento");

  const eventos = await listarEventosAdmin();

  return (
    <div className="flex flex-col gap-6">
      <EventosLista eventos={eventos} sugestoes={<SugestoesEvento />} />
    </div>
  );
}
