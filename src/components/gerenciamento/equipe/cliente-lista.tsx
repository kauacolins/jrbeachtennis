"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { ClienteForm } from "@/components/gerenciamento/equipe/cliente-form";
import { contagem, formatarDataCurta, formatarTelefone } from "@/lib/format";
import type { ClienteAdmin } from "@/features/usuarios/actions/listar-clientes";
import { normalizarBusca } from "@/lib/busca";

// Lista de quem fez cadastro público em /entrar — só consulta + correção
// de nome/e-mail/telefone quando o cliente pede por telefone (ver
// ClienteForm). Sem criar/excluir aqui: essa conta nasce e morre pelo
// próprio fluxo de autenticação do cliente.
export function ClienteLista({ clientes }: { clientes: ClienteAdmin[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [clienteEditando, setClienteEditando] = useState<ClienteAdmin | null>(null);

  const clientesFiltrados = useMemo(() => {
    const termo = normalizarBusca(busca.trim());
    if (!termo) return clientes;
    return clientes.filter((cliente) =>
      [cliente.name, cliente.email, cliente.telefone ?? ""].some((campo) =>
        normalizarBusca(campo).includes(termo)
      )
    );
  }, [clientes, busca]);

  return (
    <div className="flex flex-col gap-3">
      <CabecalhoLista
        titulo="Clientes"
        contagem={clientes.length > 0 ? contagem(clientes.length, "cliente cadastrado", "clientes cadastrados") : undefined}
        acao={
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
        }
      />

      {clientesFiltrados.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {clientes.length === 0
            ? "Nenhum cliente cadastrado ainda."
            : "Nenhum cliente encontrado."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="hidden sm:table-cell">Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientesFiltrados.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.name}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{cliente.email}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {cliente.telefone ? formatarTelefone(cliente.telefone) : "—"}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                  {formatarDataCurta(cliente.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setClienteEditando(cliente)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
