"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SeletorData } from "@/components/gerenciamento/seletor-data";
import { cn } from "@/lib/utils";
import { reduzirImagem } from "@/lib/reduzir-imagem";
import { dataParaISO, formatarHora } from "@/lib/format";
import { ImagemEvento } from "@/components/gerenciamento/eventos/imagem-evento";
import { salvarEvento } from "@/features/eventos/actions/salvar-evento";
import type { EventoAdmin } from "@/features/eventos/actions/listar-eventos";

interface Valores {
  titulo: string;
  resumo: string;
  descricao: string;
  data: string;
  hora: string;
  ativo: boolean;
}

function valoresIniciais(evento: EventoAdmin | null): Valores {
  return evento
    ? {
        titulo: evento.titulo,
        resumo: evento.resumo ?? "",
        descricao: evento.descricao ?? "",
        data: evento.data ? dataParaISO(evento.data) : "",
        hora: evento.data ? formatarHora(evento.data) : "",
        ativo: evento.ativo,
      }
    : { titulo: "", resumo: "", descricao: "", data: "", hora: "", ativo: true };
}

// Cadastro/edição do aviso mostrado no modal de entrada do site.
export function EventoFormDialog({
  aberto,
  onOpenChange,
  evento,
  onSalvo,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  evento: EventoAdmin | null;
  onSalvo?: () => void;
}) {
  const [valores, setValores] = useState<Valores>(() => valoresIniciais(evento));
  // undefined = mantém a imagem atual; null = remover; File = trocar
  const [novaImagem, setNovaImagem] = useState<File | null | undefined>(undefined);
  const [previa, setPrevia] = useState<string | null>(null);
  const [preparandoImagem, setPreparandoImagem] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const inputImagem = useRef<HTMLInputElement>(null);
  const [salvando, startTransition] = useTransition();

  useEffect(() => {
    if (!aberto) return;
    setValores(valoresIniciais(evento));
    setNovaImagem(undefined);
    setPrevia(evento?.imagemUrl ?? null);
  }, [aberto, evento]);

  // libera a URL temporária da prévia quando ela é trocada
  useEffect(() => {
    if (!previa?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  async function processarImagem(arquivo: File) {
    if (!arquivo.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem.");
      return;
    }
    setPreparandoImagem(true);
    try {
      const reduzida = await reduzirImagem(arquivo);
      setNovaImagem(reduzida);
      setPrevia(URL.createObjectURL(reduzida));
    } catch {
      toast.error("Não foi possível abrir essa imagem. Tente outra.");
    } finally {
      setPreparandoImagem(false);
    }
  }

  function escolherImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (arquivo) processarImagem(arquivo);
  }

  function soltarImagem(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(false);
    const arquivo = e.dataTransfer.files?.[0];
    if (arquivo) processarImagem(arquivo);
  }

  function removerImagem() {
    setNovaImagem(null);
    setPrevia(null);
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const resultado = await salvarEvento(
        {
          eventoId: evento?.id,
          titulo: valores.titulo,
          resumo: valores.resumo,
          descricao: valores.descricao,
          data: valores.data,
          hora: valores.hora,
          ativo: valores.ativo,
        },
        novaImagem
      );
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(evento ? "Evento atualizado." : "Evento cadastrado.");
      onOpenChange(false);
      onSalvo?.();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{evento ? "Editar evento" : "Novo evento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={salvar} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div
              role="button"
              tabIndex={0}
              aria-label={previa ? "Trocar imagem do evento" : "Escolher imagem do evento"}
              onClick={() => inputImagem.current?.click()}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                inputImagem.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={soltarImagem}
              className={cn(
                "group relative size-28 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                arrastando ? "border-primary" : "border-transparent"
              )}
            >
              <ImagemEvento
                imagemUrl={previa}
                titulo={valores.titulo || "Imagem do evento"}
                sizes="112px"
                className="size-full"
              />
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                  (preparandoImagem || arrastando) && "opacity-100"
                )}
              >
                {preparandoImagem ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                ) : (
                  <Camera className="size-5" aria-hidden />
                )}
              </div>
              {previa && !preparandoImagem && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removerImagem();
                  }}
                  aria-label="Remover imagem"
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background text-foreground shadow-sm hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <X className="size-3" aria-hidden />
                </button>
              )}
            </div>
            <input
              ref={inputImagem}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={escolherImagem}
            />
            <p className="text-sm text-muted-foreground">
              {previa ? "Toque na imagem para trocar." : "Toque ou arraste uma imagem aqui."}
              <br />
              JPG, PNG ou WebP (opcional).
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evento-titulo">Título</Label>
            <Input
              id="evento-titulo"
              required
              minLength={2}
              placeholder="Aula de beach tennis hoje"
              value={valores.titulo}
              onChange={(e) => setValores((v) => ({ ...v, titulo: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evento-resumo">Resumo (mostrado no modal)</Label>
            <Input
              id="evento-resumo"
              placeholder="Hoje às 19h, na quadra 2"
              value={valores.resumo}
              onChange={(e) => setValores((v) => ({ ...v, resumo: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evento-descricao">Descrição (página de detalhe)</Label>
            <Textarea
              id="evento-descricao"
              rows={4}
              value={valores.descricao}
              onChange={(e) => setValores((v) => ({ ...v, descricao: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Data (opcional)</Label>
              <SeletorData
                valor={valores.data}
                onAlterar={(data) => setValores((v) => ({ ...v, data }))}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="evento-hora">Hora (opcional)</Label>
              <Input
                id="evento-hora"
                type="time"
                value={valores.hora}
                onChange={(e) => setValores((v) => ({ ...v, hora: e.target.value }))}
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
            Mostrar no modal de entrada do site
          </label>

          <DialogFooter>
            <Button type="submit" disabled={salvando || preparandoImagem}>
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
