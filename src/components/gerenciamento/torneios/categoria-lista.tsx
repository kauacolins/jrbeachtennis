"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { CategoriaFormDialog } from "@/components/gerenciamento/torneios/categoria-form-dialog";
import { formatarPreco } from "@/lib/format";
import { removerCategoria } from "@/features/torneios/actions/remover-categoria";
import { cn } from "@/lib/utils";
import type { CategoriaDoTorneio } from "@/features/torneios/actions/obter-torneio";
import type { Modalidade } from "@/features/modalidades/actions/listar-modalidades";

// Categorias do torneio: modalidade + nome livre + atletas por inscrição
// (docs/TORNEIOS.md). Um torneio pode misturar modalidades.
export function CategoriaLista({
  torneioId,
  categorias,
  modalidades,
}: {
  torneioId: string;
  categorias: CategoriaDoTorneio[];
  modalidades: Modalidade[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<CategoriaDoTorneio | null>(null);

  function abrir(categoria: CategoriaDoTorneio | null) {
    setEditando(categoria);
    setAberto(true);
  }

  async function remover(categoriaId: string) {
    const resultado = await removerCategoria(categoriaId, torneioId);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Categoria excluída.");
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold">Categorias</h2>
        <Button
          size="sm"
          disabled={modalidades.length === 0}
          onClick={() => abrir(null)}
        >
          <Plus aria-hidden />
          Nova categoria
        </Button>
      </div>

      {modalidades.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Cadastre uma modalidade em Quadras antes de criar categorias.
        </p>
      )}

      {categorias.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Nenhuma categoria cadastrada ainda.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead className="hidden sm:table-cell">Modalidade</TableHead>
              <TableHead className="hidden sm:table-cell">Atletas</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Vagas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.map((categoria) => {
              const inscritos = categoria._count.inscricoes;
              const restantes = categoria.vagas !== null ? categoria.vagas - inscritos : null;
              const cheia = restantes !== null && restantes <= 0;
              const poucasVagas = restantes !== null && restantes > 0 && restantes <= 3;
              return (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nome}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {categoria.modalidade.nome}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                    {categoria.minAtletas === categoria.maxAtletas
                      ? categoria.minAtletas
                      : `${categoria.minAtletas}–${categoria.maxAtletas}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatarPreco(categoria.valorCentavos)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      cheia ? "font-medium text-destructive" : poucasVagas ? "font-medium text-warning" : "text-muted-foreground"
                    )}
                  >
                    {categoria.vagas !== null ? `${inscritos}/${categoria.vagas}` : inscritos}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={
                          <Link
                            href={`/gerenciamento/torneios/${torneioId}/inscritos#categoria-${categoria.id}`}
                          />
                        }
                      >
                        <Users aria-hidden />
                        <span className="sr-only">Ver inscritos de {categoria.nome}</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => abrir(categoria)}>
                        Editar
                      </Button>
                      <ConfirmarBotao
                        size="sm"
                        variant="destructive"
                        actionVariant="destructive"
                        label="Excluir"
                        titulo="Excluir essa categoria?"
                        descricao="Essa ação não pode ser desfeita."
                        textoConfirmar="Excluir"
                        textoConfirmando="Excluindo…"
                        onConfirmar={() => remover(categoria.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <CategoriaFormDialog
        aberto={aberto}
        onOpenChange={setAberto}
        torneioId={torneioId}
        categoria={editando}
        modalidades={modalidades}
        onSalvo={() => router.refresh()}
      />
    </section>
  );
}
