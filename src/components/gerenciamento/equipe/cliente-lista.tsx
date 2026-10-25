"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, ChevronRight, Mail, Phone, Users } from "lucide-react";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { MensagemClienteMenu } from "@/components/gerenciamento/clientes/mensagem-cliente-menu";
import { contagem, formatarDataCurta, formatarTelefone } from "@/lib/format";
import { filtrarPorBusca } from "@/lib/busca";
import type { ClienteAdmin } from "@/features/usuarios/actions/listar-clientes";

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes.at(-1)![0] : "")).toUpperCase();
}

// Quem fez cadastro público em /entrar, em cards. O card inteiro leva pro
// detalhe (consumo + mensagens + edição); o botão de mensagem fica por cima
// do link (relative z-10) pra mandar WhatsApp direto da lista, sem abrir o
// cliente. Sem criar/excluir aqui: essa conta nasce e morre pelo próprio
// fluxo de autenticação do cliente.
export function ClienteLista({ clientes, siteUrl }: { clientes: ClienteAdmin[]; siteUrl: string }) {
  const [busca, setBusca] = useState("");

  const clientesFiltrados = useMemo(
    () => filtrarPorBusca(clientes, busca, (c) => [c.name, c.email, c.telefone]),
    [clientes, busca]
  );

  return (
    <div className="flex flex-col gap-3">
      <CabecalhoLista
        titulo="Clientes"
        contagem={clientes.length > 0 ? contagem(clientes.length, "cliente cadastrado", "clientes cadastrados") : undefined}
        acao={
          clientes.length > 0 && (
            <CampoBusca
              value={busca}
              onChange={setBusca}
              placeholder="Buscar por nome, e-mail ou telefone…"
              ariaLabel="Buscar clientes"
            />
          )
        }
      />

      {clientes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <Users className="size-6" aria-hidden />
          Nenhum cliente cadastrado ainda.
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <SemResultadoBusca busca={busca} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {clientesFiltrados.map((cliente) => (
            <li
              key={cliente.id}
              className="relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors focus-within:border-ring hover:border-foreground/30"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
                  aria-hidden
                >
                  {iniciais(cliente.name)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/gerenciamento/clientes/${cliente.id}`}
                    className="truncate font-semibold outline-none after:absolute after:inset-0 after:rounded-xl"
                  >
                    {cliente.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    Cliente desde {formatarDataCurta(cliente.createdAt)}
                  </span>
                </div>
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              </div>

              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <dt className="sr-only">Telefone</dt>
                  <Phone className="size-3.5 shrink-0" aria-hidden />
                  <dd className="tabular-nums">{cliente.telefone ? formatarTelefone(cliente.telefone) : "Sem telefone"}</dd>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <dt className="sr-only">E-mail</dt>
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  <dd className="truncate">{cliente.email}</dd>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <dt className="sr-only">Reservas</dt>
                  <CalendarCheck className="size-3.5 shrink-0" aria-hidden />
                  <dd>{contagem(cliente._count.reservas, "reserva", "reservas")}</dd>
                </div>
              </dl>

              <MensagemClienteMenu
                nome={cliente.name}
                telefone={cliente.telefone}
                siteUrl={siteUrl}
                className="relative z-10 mt-auto w-full"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
