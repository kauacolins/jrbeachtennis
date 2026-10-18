import { notFound, redirect } from "next/navigation";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import { blobHabilitado } from "@/lib/blob";
import { obterTorneio } from "@/features/torneios/actions/obter-torneio";
import { listarModalidades } from "@/features/modalidades/actions/listar-modalidades";
import { listarQuadrasAdmin } from "@/features/quadras/actions/listar-quadras-admin";
import { TorneioDetalhe } from "@/components/gerenciamento/torneios/torneio-detalhe";

export default async function TorneioEdicaoPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await exigirSomenteAdmin())) redirect("/gerenciamento");

  const { id } = await params;
  const [torneio, modalidades, quadras] = await Promise.all([
    obterTorneio(id),
    listarModalidades(),
    listarQuadrasAdmin(),
  ]);
  if (!torneio) notFound();

  return (
    <div>
      <TorneioDetalhe
        torneio={torneio}
        modalidades={modalidades}
        quadras={quadras}
        bannerUploadHabilitado={blobHabilitado}
      />
    </div>
  );
}
