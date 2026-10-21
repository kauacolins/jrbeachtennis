"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { QuadraForm } from "@/components/gerenciamento/quadras/quadra-form";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { filtrarPorBusca } from "@/lib/busca";
import { contagem, formatarPreco } from "@/lib/format";
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
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(quadras, busca, (q) => [q.nome, ...q.modalidades.map((m) => m.nome)]);

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
      <CabecalhoLista
        titulo="Quadras"
        contagem={quadras.length > 0 ? contagem(quadras.length, "quadra cadastrada", "quadras cadastradas") : undefined}
        acao={
          <Button size="sm" onClick={abrirNova}>
            <Plus className="size-4" aria-hidden />
            Nova quadra
          </Button>
        }
      />

      {quadras.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma quadra cadastrada ainda.
        </p>
      ) : (
        <>
          <CampoBusca
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome ou modalidade"
            ariaLabel="Buscar quadra"
          />
          {visiveis.length === 0 ? (
            <SemResultadoBusca busca={busca} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Modalidades</TableHead>
                  <TableHead className="text-right">Preço/h</TableHead>
                  <TableHead className="hidden sm:table-cell">Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((quadra) => (
                  <TableRow key={quadra.id}>
                    <TableCell className="font-medium">{quadra.nome}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {quadra.modalidades.map((m) => m.nome).join(", ") || "Sem modalidade"}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatarPreco(quadra.precoHoraCentavos)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {quadra.ativa ? (
                        <Badge variant="secondary">Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
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
