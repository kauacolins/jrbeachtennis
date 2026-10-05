import { listarQuadrasAdmin } from "@/features/quadras/actions/listar-quadras-admin";
import { listarModalidades } from "@/features/modalidades/actions/listar-modalidades";
import { QuadraLista } from "@/components/gerenciamento/quadras/quadra-lista";

// RF10: CRUD de quadras.
export default async function QuadrasPage() {
  const [quadras, modalidades] = await Promise.all([
    listarQuadrasAdmin(),
    listarModalidades(),
  ]);

  return <QuadraLista quadras={quadras} modalidades={modalidades} />;
}
