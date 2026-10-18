import { listarClientes } from "@/features/usuarios/actions/listar-clientes";
import { ClienteLista } from "@/components/gerenciamento/equipe/cliente-lista";

// Quem fez cadastro público em /entrar — visualização e correção de dados
// de contato pelo admin, sem CRUD completo (ver listarClientes). Rota
// própria (não dentro de /equipe) pra sidebar não marcar Equipe junto.
export default async function ClientesPage() {
  const clientes = await listarClientes();

  return <ClienteLista clientes={clientes} />;
}
