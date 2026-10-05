import { listarUsuarios } from "@/features/usuarios/actions/listar-usuarios";
import { exigirAdmin } from "@/lib/require-admin";
import { UsuarioLista } from "@/components/gerenciamento/configuracoes/usuario-lista";

// CRUD das contas de equipe (ADMIN/OPERATOR/INTRUCTOR) — cliente não entra
// aqui, só nasce pelo cadastro público em /entrar.
export default async function UsuariosConfigPage() {
  const [usuarios, admin] = await Promise.all([listarUsuarios(), exigirAdmin()]);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-heading text-xl font-bold">Usuários</h1>
      <UsuarioLista usuarios={usuarios} usuarioAtualId={admin?.id ?? ""} />
    </div>
  );
}
