"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { QuadraForm } from "@/components/gerenciamento/configuracoes/quadra-form";
import { formatarPreco } from "@/lib/format";
import { removerQuadra } from "@/features/quadras/actions/remover-quadra";
import type { QuadraAdmin } from "@/features/quadras/actions/listar-quadras-admin";
import type { Modalidade } from "@/features/modalidades/actions/listar-modalidades";

// RF10: CRUD de quadras. Sem estado otimista — é uma tela de configuração
// de baixa frequência, então router.refresh() depois de cada mutação é
// simples e suficiente (diferente da agenda, onde a resposta instantânea
// importa mais).
export function QuadraLista({
  quadras,
  modalidades,
}: {
  quadras: QuadraAdmin[];
  modalidades: Modalidade[];
}) {
  const router = useRouter();
  const [formAberto, setFormAberto] = useState(false);
  const [quadraEditando, setQuadraEditando] = useState<QuadraAdmin | null>(null);

  function abrirNova() {
    setQuadraEditando(null);
    setFormAberto(true);
  }

  function abrirEdicao(quadra: QuadraAdmin) {
    setQuadraEditando(quadra);
    setFormAberto(true);
  }

  async function remover(id: string) {
    const resultado = await removerQuadra(id);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Quadra excluída.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Quadras</h1>
        <Button size="sm" onClick={abrirNova}>
          <Plus className="size-4" aria-hidden />
          Nova quadra
        </Button>
      </div>

      {quadras.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma quadra cadastrada ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {quadras.map((quadra) => (
            <li
              key={quadra.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {quadra.nome}
                  {!quadra.ativa && (
                    <span className="ml-2 text-xs text-muted-foreground">(inativa)</span>
                  )}
                </p>
                <p className="text-muted-foreground">
                  {quadra.modalidades.map((m) => m.nome).join(", ") || "Sem modalidade"} ·{" "}
                  {formatarPreco(quadra.precoHoraCentavos)}/h
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => abrirEdicao(quadra)}>
                  Editar
                </Button>
                <ConfirmarBotao
                  size="sm"
                  variant="destructive"
                  actionVariant="destructive"
                  label="Excluir"
                  titulo="Excluir essa quadra?"
                  descricao="Só funciona se ela não tiver horário, bloqueio ou reserva cadastrados. Essa ação não pode ser desfeita."
                  textoConfirmar="Excluir"
                  textoConfirmando="Excluindo…"
                  onConfirmar={() => remover(quadra.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <QuadraForm
        aberto={formAberto}
        onOpenChange={setFormAberto}
        quadra={quadraEditando}
        modalidades={modalidades}
        onSalvo={() => router.refresh()}
      />
    </div>
  );
}
