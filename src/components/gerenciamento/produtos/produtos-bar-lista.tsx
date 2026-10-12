"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { filtrarPorBusca } from "@/lib/busca";
import { formatarPreco } from "@/lib/format";
import { reduzirImagem } from "@/lib/reduzir-imagem";
import { FotoProduto } from "@/components/gerenciamento/produtos/foto-produto";
import { salvarProdutoBar } from "@/features/produtos/actions/salvar-produto";
import type { ProdutoBarAdmin } from "@/features/produtos/actions/listar-produtos";

// O Select não aceita "" como valor de item; "sem categoria" usa esta chave.
const SEM_CATEGORIA = "__sem_categoria__";

interface Valores {
  nome: string;
  categoria: string;
  precoReais: string;
  ativo: boolean;
}

function valoresIniciais(produto: ProdutoBarAdmin | null): Valores {
  return produto
    ? {
        nome: produto.nome,
        categoria: produto.categoria ?? "",
        precoReais: (produto.precoCentavos / 100).toFixed(2),
        ativo: produto.ativo,
      }
    : { nome: "", categoria: "", precoReais: "", ativo: true };
}

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
  const [valores, setValores] = useState<Valores>(() => valoresIniciais(null));
  // undefined = mantém a foto atual; null = remover; File = trocar
  const [novaFoto, setNovaFoto] = useState<File | null | undefined>(undefined);
  const [previa, setPrevia] = useState<string | null>(null);
  const [preparandoFoto, setPreparandoFoto] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);
  const [salvando, startTransition] = useTransition();
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(produtos, busca, (p) => [p.nome, p.categoria]);

  useEffect(() => {
    if (!aberto) return;
    setValores(valoresIniciais(editando));
    setNovaFoto(undefined);
    setPrevia(editando?.fotoUrl ?? null);
  }, [aberto, editando]);

  // libera a URL temporária da prévia quando ela é trocada
  useEffect(() => {
    if (!previa?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem.");
      return;
    }
    setPreparandoFoto(true);
    try {
      const reduzida = await reduzirImagem(arquivo);
      setNovaFoto(reduzida);
      setPrevia(URL.createObjectURL(reduzida));
    } catch {
      toast.error("Não foi possível abrir essa imagem. Tente outra.");
    } finally {
      setPreparandoFoto(false);
    }
  }

  function removerFoto() {
    setNovaFoto(null);
    setPrevia(null);
  }

  // Categorias vêm do SelectGroup categoria_produto. Se o produto em edição
  // tem uma que saiu da lista (desativada), ela continua aparecendo pra não
  // ser trocada sem querer.
  const opcoesCategoria =
    editando?.categoria && !categorias.includes(editando.categoria)
      ? [...categorias, editando.categoria]
      : categorias;

  function abrir(produto: ProdutoBarAdmin | null) {
    setEditando(produto);
    setAberto(true);
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const precoCentavos = Math.round(Number(valores.precoReais.replace(",", ".")) * 100);
    if (!Number.isFinite(precoCentavos) || precoCentavos < 0) {
      toast.error("Preço inválido.");
      return;
    }
    startTransition(async () => {
      const resultado = await salvarProdutoBar(
        {
          produtoId: editando?.id,
          nome: valores.nome,
          categoria: valores.categoria,
          precoCentavos,
          ativo: valores.ativo,
        },
        novaFoto
      );
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(editando ? "Produto atualizado." : "Produto cadastrado.");
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="bar-titulo" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="bar-titulo" className="font-heading text-xl font-bold">
          Bar
        </h2>
        <Button size="sm" onClick={() => abrir(null)}>
          <Plus aria-hidden />
          Novo produto
        </Button>
      </div>

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
                      {formatarPreco(produto.precoCentavos)}
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

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <FotoProduto
                fotoUrl={previa}
                nome={valores.nome || "Foto do produto"}
                sizes="96px"
                className="size-24 shrink-0 rounded-lg border"
              />
              <div className="flex flex-col items-start gap-1.5">
                <input
                  ref={inputFoto}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  onChange={escolherFoto}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={preparandoFoto}
                  onClick={() => inputFoto.current?.click()}
                >
                  <Camera aria-hidden />
                  {preparandoFoto ? "Preparando…" : previa ? "Trocar foto" : "Escolher foto"}
                </Button>
                {previa && (
                  <Button type="button" variant="ghost" size="sm" onClick={removerFoto}>
                    <Trash2 aria-hidden />
                    Remover foto
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="produto-nome">Nome</Label>
              <Input
                id="produto-nome"
                required
                minLength={2}
                value={valores.nome}
                onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="produto-categoria">Categoria</Label>
                <Select
                  value={valores.categoria || SEM_CATEGORIA}
                  onValueChange={(valor) =>
                    setValores((v) => ({
                      ...v,
                      categoria: !valor || valor === SEM_CATEGORIA ? "" : (valor as string),
                    }))
                  }
                >
                  <SelectTrigger id="produto-categoria" className="h-9! w-full">
                    <SelectValue>
                      {(valor: string) => (valor === SEM_CATEGORIA ? "Sem categoria" : valor)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_CATEGORIA}>Sem categoria</SelectItem>
                    {opcoesCategoria.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="produto-preco">Preço (R$)</Label>
                <Input
                  id="produto-preco"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={valores.precoReais}
                  onChange={(e) => setValores((v) => ({ ...v, precoReais: e.target.value }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={valores.ativo}
                onChange={(e) => setValores((v) => ({ ...v, ativo: e.target.checked }))}
                className="size-4 accent-primary"
              />
              Disponível para lançar nas comandas
            </label>
            <DialogFooter>
              <Button type="submit" disabled={salvando || preparandoFoto}>
                {salvando ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
