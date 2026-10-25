import { listarClientes } from "@/features/usuarios/actions/listar-clientes";
import { ClienteLista } from "@/components/gerenciamento/equipe/cliente-lista";
import { SITE_URL } from "@/lib/constants";

// Quem fez cadastro público em /entrar, em cards; cada um abre o detalhe
// em /gerenciamento/clientes/[id] (consumo + mensagens). Rota própria (não
// dentro de /equipe) pra sidebar não marcar Equipe junto.
export default async function ClientesPage() {
  const clientes = await listarClientes();

  return <ClienteLista clientes={clientes} siteUrl={SITE_URL} />;
}
