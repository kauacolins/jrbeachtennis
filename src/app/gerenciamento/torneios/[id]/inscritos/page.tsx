import { notFound, redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/require-admin";
import { obterTorneio } from "@/features/torneios/actions/obter-torneio";
import { listarInscritos } from "@/features/torneios/actions/listar-inscritos";
import { InscritosLista } from "@/components/gerenciamento/torneios/inscritos-lista";

// Lista de inscritos: admin e operador podem ver e marcar pago (mesma
// regra de comandas — preço já foi fixado ao criar a categoria).
export default async function InscritosPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await exigirAdmin())) redirect("/gerenciamento");

  const { id } = await params;
  const [torneio, inscricoes] = await Promise.all([obterTorneio(id), listarInscritos(id)]);
  if (!torneio) notFound();

  return (
    <div>
      <InscritosLista torneio={torneio} inscricoes={inscricoes} />
    </div>
  );
}
