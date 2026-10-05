"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClienteForm } from "@/components/gerenciamento/equipe/cliente-form";
import { formatarDataCurta, formatarTelefone } from "@/lib/format";
import type { ClienteAdmin } from "@/features/usuarios/actions/listar-clientes";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// Lista de quem fez cadastro público em /entrar — só consulta + correção
// de nome/e-mail/telefone quando o cliente pede por telefone (ver
// ClienteForm). Sem criar/excluir aqui: essa conta nasce e morre pelo
// próprio fluxo de autenticação do cliente.
export function ClienteLista({ clientes }: { clientes: ClienteAdmin[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [clienteEditando, setClienteEditando] = useState<ClienteAdmin | null>(null);

  const clientesFiltrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return clientes;
    return clientes.filter((cliente) =>
      [cliente.name, cliente.email, cliente.telefone ?? ""].some((campo) =>
        normalizar(campo).includes(termo)
      )
    );
  }, [clientes, busca]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Clientes</h1>
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone…"
            aria-label="Buscar clientes"
            className="h-9 pl-8"
          />
        </div>
      </div>

      {clientesFiltrados.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {clientes.length === 0
            ? "Nenhum cliente cadastrado ainda."
            : "Nenhum cliente encontrado."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {clientesFiltrados.map((cliente) => (
            <li
              key={cliente.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{cliente.name}</p>
                <p className="text-muted-foreground">
                  {cliente.email}
                  {cliente.telefone ? ` · ${formatarTelefone(cliente.telefone)}` : ""}
                  {" · cadastrado em "}
                  {formatarDataCurta(cliente.createdAt)}
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={() => setClienteEditando(cliente)}>
                Editar
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ClienteForm
        aberto={clienteEditando !== null}
        onOpenChange={(aberto) => !aberto && setClienteEditando(null)}
        cliente={clienteEditando}
        onSalvo={() => router.refresh()}
      />
    </div>
  );
}
