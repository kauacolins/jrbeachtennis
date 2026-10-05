import { listarClientes } from "@/features/usuarios/actions/listar-clientes";
import { ClienteLista } from "@/components/gerenciamento/equipe/cliente-lista";

// Quem fez cadastro público em /entrar — visualização e correção de dados
// de contato pelo admin, sem CRUD completo (ver listarClientes).
export default async function ClientesPage() {
  const clientes = await listarClientes();

  return <ClienteLista clientes={clientes} />;
}
