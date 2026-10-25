"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SeletorData } from "@/components/gerenciamento/seletor-data";
import { cn } from "@/lib/utils";
import { reduzirImagem } from "@/lib/reduzir-imagem";
import { ImagemEvento } from "@/components/gerenciamento/eventos/imagem-evento";
import { salvarEvento } from "@/features/eventos/actions/salvar-evento";
import type { EventoAdmin } from "@/features/eventos/actions/listar-eventos";
import type { ValoresEvento } from "@/features/eventos/modelos";

// Cadastro/edição do aviso mostrado no modal de entrada do site. Tela normal
// (não diálogo) pra caber o calendário e pra abrir já preenchida a partir de
// uma sugestão (ver MODELOS_EVENTO) — nesse caso `origem` diz qual foi.
export function EventoForm({
  evento,
  valoresIniciais,
  origem,
}: {
  evento: EventoAdmin | null;
  valoresIniciais: ValoresEvento;
  origem?: string;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<ValoresEvento>(valoresIniciais);
  // undefined = mantém a imagem atual; null = remover; File = trocar
  const [novaImagem, setNovaImagem] = useState<File | null | undefined>(undefined);
  const [previa, setPrevia] = useState<string | null>(evento?.imagemUrl ?? null);
  const [preparandoImagem, setPreparandoImagem] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const inputImagem = useRef<HTMLInputElement>(null);
  const [salvando, startTransition] = useTransition();

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
      router.push("/gerenciamento/eventos");
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/gerenciamento/eventos" />}>
          <ArrowLeft aria-hidden />
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="font-heading text-xl font-bold">{evento ? "Editar evento" : "Novo evento"}</h1>
      </div>

      {origem && (
        <p className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
          <span>
            Preenchido a partir da sugestão <strong>{origem}</strong>. Revise o texto antes de salvar.
          </span>
        </p>
      )}

      <form onSubmit={salvar} className="flex flex-col gap-3 rounded-xl border bg-background p-4">
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/gerenciamento/eventos" />}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando || preparandoImagem}>
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
