"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, GraduationCap, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { InstrutorForm } from "@/components/gerenciamento/instrutores/instrutor-form";
import { cn } from "@/lib/utils";
import { contagem, formatarTelefone } from "@/lib/format";
import type { InstrutorLinha } from "@/features/instrutores/actions/listar-instrutores";

const SITUACOES = [
  { chave: "EM_DIA", label: "em dia", ponto: "bg-primary" },
  { chave: "VENCENDO", label: "vencendo", ponto: "bg-warning" },
  { chave: "EM_ABERTO", label: "em aberto", ponto: "bg-warning" },
  { chave: "VENCIDO", label: "vencidos", ponto: "bg-destructive" },
] as const;

// Instrutores da arena, cada um com seus alunos e mensalidades
// (docs/INSTRUTORES.md). Cadastro e preços só o admin mexe.
export function InstrutoresLista({
  instrutores,
  podeEditar,
}: {
  instrutores: InstrutorLinha[];
  podeEditar: boolean;
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const ativos = instrutores.filter((i) => i.ativo).length;

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoLista
        titulo="Instrutores"
        contagem={ativos > 0 ? contagem(ativos, "instrutor ativo", "instrutores ativos") : undefined}
        acao={
          podeEditar && (
            <Button size="lg" className="h-11 px-5 text-base" onClick={() => setCriando(true)}>
              <Plus className="size-5" aria-hidden />
              Novo instrutor
            </Button>
          )
        }
      />

      {instrutores.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <GraduationCap className="size-6" aria-hidden />
          {podeEditar
            ? "Nenhum instrutor cadastrado. Cadastre o primeiro e os planos dele."
            : "Nenhum instrutor cadastrado ainda. Peça pro admin cadastrar."}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {instrutores.map((i) => (
            <li key={i.id}>
              <Link
                href={`/gerenciamento/instrutores/${i.id}`}
                className={cn(
                  "flex h-full flex-col gap-3 rounded-xl border bg-card p-4 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
                  !i.ativo && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{i.nome}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                      <Phone className="size-3" aria-hidden />
                      {i.telefone ? formatarTelefone(i.telefone) : "Sem telefone"}
                    </span>
                  </div>
                  {i.ativo ? (
                    <span className="font-heading text-lg font-bold tabular-nums">
                      {contagem(i.alunos, "aluno", "alunos")}
                    </span>
                  ) : (
                    <Badge className="rounded-full bg-muted text-[11px] text-muted-foreground">Inativo</Badge>
                  )}
                </div>
                {i.ativo && i.alunos > 0 && (
                  <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {SITUACOES.filter((s) => i.situacoes[s.chave] > 0).map((s) => (
                      <li key={s.chave} className="flex items-center gap-1.5 tabular-nums">
                        <span className={cn("size-2 rounded-full", s.ponto)} aria-hidden />
                        {i.situacoes[s.chave]} {s.label}
                      </li>
                    ))}
                  </ul>
                )}
                {i.ativo && i.planosAtivos === 0 && (
                  <p className="text-xs text-warning">Sem plano de aula cadastrado</p>
                )}
                <span className="mt-auto flex items-center gap-1 text-sm font-medium">
                  Ver alunos
                  <ChevronRight className="size-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <InstrutorForm
        aberto={criando}
        onOpenChange={setCriando}
        instrutor={null}
        onSalvo={(id) => router.push(`/gerenciamento/instrutores/${id}`)}
      />
    </div>
  );
}
