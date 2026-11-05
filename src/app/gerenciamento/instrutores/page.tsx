import { exigirAdmin } from "@/lib/require-admin";
import { listarInstrutores } from "@/features/instrutores/actions/listar-instrutores";
import { InstrutoresLista } from "@/components/gerenciamento/instrutores/instrutores-lista";

// Instrutores e alunos (docs/INSTRUTORES.md): admin e operador veem e
// cuidam das mensalidades; cadastro de instrutor e preços, só o admin.
export default async function InstrutoresPage() {
  const usuario = await exigirAdmin();
  if (!usuario) return null;
  const instrutores = await listarInstrutores();
  return <InstrutoresLista instrutores={instrutores} podeEditar={usuario.role === "ADMIN"} />;
}
