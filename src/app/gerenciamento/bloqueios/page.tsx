import { listarBloqueiosFuturos } from "@/features/bloqueios/actions/listar-bloqueios";
import { listarQuadrasAdmin } from "@/features/quadras/actions/listar-quadras-admin";
import { BloqueioForm } from "@/components/gerenciamento/bloqueio-form";
import { BloqueioLista } from "@/components/gerenciamento/bloqueio-lista";

// RF12: bloquear horários pontuais (manutenção, evento, feriado, day use).
export default async function BloqueiosPage() {
  const [bloqueios, quadras] = await Promise.all([
    listarBloqueiosFuturos(),
    listarQuadrasAdmin(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 font-heading text-xl font-bold">Bloqueios de horário</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Bloqueie horários pontuais por manutenção, evento, feriado ou pra
        reservar uma quadra pro day use.
      </p>

      <div className="mb-6 rounded-xl border p-4">
        <BloqueioForm quadras={quadras} />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
        Próximos bloqueios
      </h2>
      <BloqueioLista bloqueiosIniciais={bloqueios} />
    </div>
  );
}
