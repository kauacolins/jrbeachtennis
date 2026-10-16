import { notFound, redirect } from "next/navigation";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import { obterTorneio } from "@/features/torneios/actions/obter-torneio";
import { listarInscritos } from "@/features/torneios/actions/listar-inscritos";
import { TorneioVisaoGeral } from "@/components/gerenciamento/torneios/torneio-visao-geral";

export default async function TorneioPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await exigirSomenteAdmin())) redirect("/gerenciamento");

  const { id } = await params;
  const [torneio, inscricoes] = await Promise.all([obterTorneio(id), listarInscritos(id)]);
  if (!torneio) notFound();

  return (
    <div className="px-4 py-6">
      <TorneioVisaoGeral torneio={torneio} inscricoes={inscricoes} />
    </div>
  );
}
