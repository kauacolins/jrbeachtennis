"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { UsuarioForm } from "@/components/gerenciamento/configuracoes/usuario-form";
import { formatarTelefone } from "@/lib/format";
import { removerUsuario } from "@/features/usuarios/actions/remover-usuario";
import { PAPEIS_EQUIPE } from "@/features/usuarios/schema";
import type { UsuarioAdmin } from "@/features/usuarios/actions/listar-usuarios";

const LABEL_PAPEL: Record<(typeof PAPEIS_EQUIPE)[number], string> = {
  ADMIN: "Admin",
  OPERATOR: "Operador",
  INTRUCTOR: "Instrutor",
};

const FILTRO_TODOS = "TODOS" as const;
type FiltroPapel = typeof FILTRO_TODOS | (typeof PAPEIS_EQUIPE)[number];

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// CRUD de contas de equipe (admin/operador/instrutor). Trocar papel ou
// excluir exige confirmação — são ações sensíveis (elevação de acesso ou
// perda de acesso) e o próprio admin não consegue se auto-rebaixar nem se
// auto-excluir (ver atualizarUsuario/removerUsuario).
export function UsuarioLista({
  usuarios,
  usuarioAtualId,
}: {
  usuarios: UsuarioAdmin[];
  usuarioAtualId: string;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtroPapel, setFiltroPapel] = useState<FiltroPapel>(FILTRO_TODOS);
  const [formAberto, setFormAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioAdmin | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const usuariosFiltrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    return usuarios.filter((usuario) => {
      const bateBusca =
        !termo ||
        [usuario.name, usuario.email].some((campo) => normalizar(campo).includes(termo));
      const batePapel = filtroPapel === FILTRO_TODOS || usuario.role === filtroPapel;
      return bateBusca && batePapel;
    });
  }, [usuarios, busca, filtroPapel]);

  function abrirNovo() {
    setUsuarioEditando(null);
    setFormAberto(true);
  }

  function abrirEdicao(usuario: UsuarioAdmin) {
    setUsuarioEditando(usuario);
    setFormAberto(true);
  }

  async function remover(usuario: UsuarioAdmin) {
    setRemovendoId(usuario.id);
    const resultado = await removerUsuario(usuario.id);
    if (!resultado.ok) {
      toast.error(resultado.erro);
    } else {
      toast.success("Usuário excluído.");
      router.refresh();
    }
    setRemovendoId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail…"
              aria-label="Buscar usuários"
              className="h-9 pl-8"
            />
          </div>

          <Select value={filtroPapel} onValueChange={(valor) => setFiltroPapel(valor as FiltroPapel)}>
            <SelectTrigger aria-label="Filtrar por papel" className="h-9! w-40">
              <SelectValue>
                {(valor: FiltroPapel) => (valor === FILTRO_TODOS ? "Todos os papéis" : LABEL_PAPEL[valor])}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTRO_TODOS}>Todos os papéis</SelectItem>
              {PAPEIS_EQUIPE.map((papel) => (
                <SelectItem key={papel} value={papel}>
                  {LABEL_PAPEL[papel]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button size="sm" onClick={abrirNovo}>
          <Plus className="size-4" aria-hidden />
          Novo usuário
        </Button>
      </div>

      {usuariosFiltrados.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum usuário encontrado.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {usuariosFiltrados.map((usuario) => (
            <li
              key={usuario.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {usuario.name}
                  {usuario.id === usuarioAtualId && (
                    <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {LABEL_PAPEL[usuario.role as (typeof PAPEIS_EQUIPE)[number]] ?? usuario.role}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  {usuario.email}
                  {usuario.telefone ? ` · ${formatarTelefone(usuario.telefone)}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => abrirEdicao(usuario)}>
                  Editar
                </Button>
                {usuario.id !== usuarioAtualId && (
                  <ConfirmarBotao
                    size="sm"
                    variant="destructive"
                    actionVariant="destructive"
                    label="Excluir"
                    titulo="Excluir esse usuário?"
                    descricao={`${usuario.name} perde o acesso de ${LABEL_PAPEL[usuario.role as (typeof PAPEIS_EQUIPE)[number]] ?? usuario.role} imediatamente. O histórico dele é mantido.`}
                    textoConfirmar="Excluir"
                    textoConfirmando="Excluindo…"
                    disabled={removendoId === usuario.id}
                    onConfirmar={() => remover(usuario)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <UsuarioForm
        aberto={formAberto}
        onOpenChange={setFormAberto}
        usuario={usuarioEditando}
        onSalvo={() => router.refresh()}
      />
    </div>
  );
}
