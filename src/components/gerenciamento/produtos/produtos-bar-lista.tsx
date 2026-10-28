"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { filtrarPorBusca } from "@/lib/busca";
import { contagem, formatarPreco } from "@/lib/format";
import { FotoProduto } from "@/components/gerenciamento/produtos/foto-produto";
import { ProdutoFormDialog } from "@/components/gerenciamento/produtos/produto-form-dialog";
import type { ProdutoBarAdmin } from "@/features/produtos/actions/listar-produtos";

// RF30: cardápio do bar. Sem excluir — produto inativo some do lançamento
// mas continua no histórico das comandas (regra 4).
export function ProdutosBarLista({
  produtos,
  categorias,
}: {
  produtos: ProdutoBarAdmin[];
  categorias: string[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<ProdutoBarAdmin | null>(null);
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(produtos, busca, (p) => [p.nome, p.categoria]);

  function abrir(produto: ProdutoBarAdmin | null) {
    setEditando(produto);
    setAberto(true);
  }

  return (
    <section aria-label="Bar" className="flex flex-col gap-3">
      <CabecalhoLista
        secao
        titulo="Bar"
        contagem={produtos.length > 0 ? contagem(produtos.length, "produto no cardápio", "produtos no cardápio") : undefined}
        acao={
          <Button size="sm" onClick={() => abrir(null)}>
            <Plus aria-hidden />
            Novo produto
          </Button>
        }
      />

      {produtos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum produto do bar ainda. Cadastre o que é vendido no balcão para lançar nas comandas.
        </p>
      ) : (
        <>
          <CampoBusca
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome ou categoria"
            ariaLabel="Buscar produto"
          />
          {visiveis.length === 0 ? (
            <SemResultadoBusca busca={busca} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">
                    <span className="sr-only">Foto</span>
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="hidden sm:table-cell">Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="py-2">
                      <FotoProduto
                        fotoUrl={produto.fotoUrl}
                        nome={produto.nome}
                        sizes="40px"
                        className="size-10 rounded-md"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {produto.categoria ?? "—"}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {produto.precoDinamico ? (
                        <Badge variant="outline">Preço livre</Badge>
                      ) : (
                        formatarPreco(produto.precoCentavos)
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {produto.ativo ? (
                        <Badge variant="secondary">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => abrir(produto)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      <ProdutoFormDialog
        aberto={aberto}
        onOpenChange={setAberto}
        produto={editando}
        categorias={categorias}
        onSalvo={() => router.refresh()}
      />
    </section>
  );
}
