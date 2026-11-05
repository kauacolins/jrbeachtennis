"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstrutorForm } from "@/components/gerenciamento/instrutores/instrutor-form";
import { PlanosAula } from "@/components/gerenciamento/instrutores/planos-aula";
import { AlunosLista } from "@/components/gerenciamento/instrutores/alunos-lista";
import type { FiltroAluno } from "@/components/gerenciamento/instrutores/filtros-aluno";
import type { PixArena } from "@/components/gerenciamento/reserva-detalhe-painel";
import { formatarTelefone } from "@/lib/format";
import type { InstrutorDetalhe as Detalhe } from "@/features/instrutores/actions/listar-instrutores";

// /gerenciamento/instrutores/[id]: cadastro, planos e preços e a lista de
// alunos com as mensalidades (docs/INSTRUTORES.md).
export function InstrutorDetalhe({
  detalhe,
  filtro,
  podeEditar,
  pix,
}: {
  detalhe: Detalhe;
  filtro: FiltroAluno;
  podeEditar: boolean;
  pix: PixArena | null;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const { instrutor, alunos } = detalhe;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/gerenciamento/instrutores"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Instrutores
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
              {instrutor.nome}
              {!instrutor.ativo && (
                <Badge className="rounded-full bg-muted text-[11px] text-muted-foreground">Inativo</Badge>
              )}
            </h1>
            {instrutor.telefone && (
              <a
                href={`tel:+55${instrutor.telefone}`}
                className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground tabular-nums hover:text-foreground"
              >
                <Phone className="size-3.5" aria-hidden />
                {formatarTelefone(instrutor.telefone)}
              </a>
            )}
          </div>
          {podeEditar && (
            <Button variant="outline" size="lg" onClick={() => setEditando(true)}>
              <Pencil aria-hidden />
              Editar instrutor
            </Button>
          )}
        </div>
      </div>

      <PlanosAula instrutorId={instrutor.id} planos={instrutor.planos} podeEditar={podeEditar} />

      <AlunosLista instrutor={instrutor} alunos={alunos} planos={instrutor.planos} filtro={filtro} pix={pix} />

      {podeEditar && (
        <InstrutorForm
          aberto={editando}
          onOpenChange={setEditando}
          instrutor={instrutor}
          onSalvo={() => router.refresh()}
        />
      )}
    </div>
  );
}
