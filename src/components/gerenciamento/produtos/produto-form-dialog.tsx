"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
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
  precoDinamico: boolean;
  ativo: boolean;
}

function valoresIniciais(produto: ProdutoBarAdmin | null): Valores {
  return produto
    ? {
        nome: produto.nome,
        categoria: produto.categoria ?? "",
        precoReais: produto.precoDinamico ? "" : (produto.precoCentavos / 100).toFixed(2),
        precoDinamico: produto.precoDinamico,
        ativo: produto.ativo,
      }
    : { nome: "", categoria: "", precoReais: "", precoDinamico: false, ativo: true };
}

// Cadastro/edição de produto do bar — usado tanto na tela admin de Produtos
// quanto no card "Adicionar produto" no fim da grade de lançamento (RF30).
export function ProdutoFormDialog({
  aberto,
  onOpenChange,
  produto,
  categorias,
  onSalvo,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  produto: ProdutoBarAdmin | null;
  categorias: string[];
  onSalvo?: () => void;
}) {
  const [valores, setValores] = useState<Valores>(() => valoresIniciais(produto));
  // undefined = mantém a foto atual; null = remover; File = trocar
  const [novaFoto, setNovaFoto] = useState<File | null | undefined>(undefined);
  const [previa, setPrevia] = useState<string | null>(null);
  const [preparandoFoto, setPreparandoFoto] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);
  const [salvando, startTransition] = useTransition();

  useEffect(() => {
    if (!aberto) return;
    setValores(valoresIniciais(produto));
    setNovaFoto(undefined);
    setPrevia(produto?.fotoUrl ?? null);
  }, [aberto, produto]);

  // libera a URL temporária da prévia quando ela é trocada
  useEffect(() => {
    if (!previa?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  async function processarFoto(arquivo: File) {
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

  function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (arquivo) processarFoto(arquivo);
  }

  function soltarFoto(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(false);
    const arquivo = e.dataTransfer.files?.[0];
    if (arquivo) processarFoto(arquivo);
  }

  function removerFoto() {
    setNovaFoto(null);
    setPrevia(null);
  }

  // Categorias vêm do SelectGroup categoria_produto. Se o produto em edição
  // tem uma que saiu da lista (desativada), ela continua aparecendo pra não
  // ser trocada sem querer.
  const opcoesCategoria =
    produto?.categoria && !categorias.includes(produto.categoria)
      ? [...categorias, produto.categoria]
      : categorias;

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    // Preço dinâmico não tem preço fixo: o valor é digitado a cada lançamento.
    const precoCentavos = valores.precoDinamico
      ? 0
      : Math.round(Number(valores.precoReais.replace(",", ".")) * 100);
    if (!Number.isFinite(precoCentavos) || precoCentavos < 0) {
      toast.error("Preço inválido.");
      return;
    }
    startTransition(async () => {
      const resultado = await salvarProdutoBar(
        {
          produtoId: produto?.id,
          nome: valores.nome,
          categoria: valores.categoria,
          precoCentavos,
          precoDinamico: valores.precoDinamico,
          ativo: valores.ativo,
        },
        novaFoto
      );
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(produto ? "Produto atualizado." : "Produto cadastrado.");
      onOpenChange(false);
      onSalvo?.();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{produto ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div
              role="button"
              tabIndex={0}
              aria-label={previa ? "Trocar foto do produto" : "Escolher foto do produto"}
              onClick={() => inputFoto.current?.click()}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                inputFoto.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={soltarFoto}
              className={cn(
                "group relative size-28 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                arrastando ? "border-primary" : "border-transparent"
              )}
            >
              <FotoProduto
                fotoUrl={previa}
                nome={valores.nome || "Foto do produto"}
                sizes="112px"
                className="size-full"
              />
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                  (preparandoFoto || arrastando) && "opacity-100"
                )}
              >
                {preparandoFoto ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                ) : (
                  <Camera className="size-5" aria-hidden />
                )}
              </div>
              {previa && !preparandoFoto && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removerFoto();
                  }}
                  aria-label="Remover foto"
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background text-foreground shadow-sm hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <X className="size-3" aria-hidden />
                </button>
              )}
            </div>
            <input
              ref={inputFoto}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={escolherFoto}
            />
            <p className="text-sm text-muted-foreground">
              {previa ? "Toque na foto para trocar." : "Toque ou arraste uma foto aqui."}
              <br />
              JPG, PNG ou WebP.
            </p>
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
                required={!valores.precoDinamico}
                disabled={valores.precoDinamico}
                placeholder={valores.precoDinamico ? "Na venda" : undefined}
                value={valores.precoDinamico ? "" : valores.precoReais}
                onChange={(e) => setValores((v) => ({ ...v, precoReais: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={valores.precoDinamico}
              onChange={(e) => setValores((v) => ({ ...v, precoDinamico: e.target.checked }))}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              Preço dinâmico
              <span className="block text-muted-foreground">
                O valor é digitado na hora de lançar (até R$ 100,00). Ex.: picolé.
              </span>
            </span>
          </label>
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
  );
}
