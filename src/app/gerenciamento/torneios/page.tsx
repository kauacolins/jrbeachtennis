import { redirect } from "next/navigation";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import { listarTorneios } from "@/features/torneios/actions/listar-torneios";
import { TorneioLista } from "@/components/gerenciamento/torneios/torneio-lista";

// Torneios: cadastro, categorias e quadras bloqueadas. Só ADMIN (mexe em
// preço de inscrição, igual Produtos/RF30).
export default async function TorneiosPage() {
  if (!(await exigirSomenteAdmin())) redirect("/gerenciamento");

  const torneios = await listarTorneios();

  return (
    <div>
      <TorneioLista torneios={torneios} />
    </div>
  );
}
