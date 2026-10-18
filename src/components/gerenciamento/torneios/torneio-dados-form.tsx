"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { dataParaDatetimeLocal, dataParaISO } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { STATUS_TORNEIO } from "@/lib/torneio";
import {
  BANNER_ALTURA,
  BANNER_LARGURA,
  BANNER_TAMANHO_MAXIMO,
  BANNER_TIPOS_ACEITOS,
} from "@/lib/banner-torneio";
import { SeletorData } from "@/components/gerenciamento/seletor-data";
import { salvarTorneio } from "@/features/torneios/actions/salvar-torneio";
import type { TorneioDetalhe } from "@/features/torneios/actions/obter-torneio";
import type { StatusTorneio } from "@/app/generated/prisma/enums";

function valoresIniciais(torneio: TorneioDetalhe) {
  const [inscricoesAbremData, inscricoesAbremHora] = dataParaDatetimeLocal(torneio.inscricoesAbrem).split("T");
  const [inscricoesFechamData, inscricoesFechamHora] = dataParaDatetimeLocal(torneio.inscricoesFecham).split("T");
  const [destaqueAteData, destaqueAteHora] = torneio.destaqueAte
    ? dataParaDatetimeLocal(torneio.destaqueAte).split("T")
    : ["", ""];
  return {
    nome: torneio.nome,
    slug: torneio.slug,
    descricao: torneio.descricao ?? "",
    doacao: torneio.doacao ?? "",
    dataInicio: dataParaISO(torneio.dataInicio),
    dataFim: dataParaISO(torneio.dataFim),
    inscricoesAbremData,
    inscricoesAbremHora,
    inscricoesFechamData,
    inscricoesFechamHora,
    maxCategoriasAtleta: torneio.maxCategoriasAtleta?.toString() ?? "",
    destaqueHome: torneio.destaqueHome,
    destaqueAteData,
    destaqueAteHora,
    status: torneio.status,
  };
}

// Dados do torneio (docs/TORNEIOS.md): ficam numa seção da própria página,
// não num diálogo — são muitos campos pra caber numa janela pequena, e é a
// tela principal de edição (diferente do card "Novo torneio", que só pede o
// essencial pra abrir o registro).
export function TorneioDadosForm({
  torneio,
  bannerUploadHabilitado,
}: {
  torneio: TorneioDetalhe;
  bannerUploadHabilitado: boolean;
}) {
  const router = useRouter();
  const [valores, setValores] = useState(() => valoresIniciais(torneio));
  const [novoBanner, setNovoBanner] = useState<File | null | undefined>(undefined);
  const [previa, setPrevia] = useState<string | null>(torneio.bannerUrl);
  const inputBanner = useRef<HTMLInputElement>(null);
  const [salvando, startTransition] = useTransition();

  function escolherBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    if (!BANNER_TIPOS_ACEITOS.includes(arquivo.type)) {
      toast.error("O banner precisa ser JPG ou WebP.");
      return;
    }
    if (arquivo.size > BANNER_TAMANHO_MAXIMO) {
      toast.error("Banner grande demais. Máximo 1 MB.");
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setNovoBanner(arquivo);
    setPrevia(url);
    avisarSeForaDaProporcao(url);
  }

  // Não bloqueia: arte em outra proporção ainda funciona, só sai cortada
  // pelo object-cover — o aviso é pro admin saber antes de publicar.
  function avisarSeForaDaProporcao(url: string) {
    const img = new window.Image();
    img.onload = () => {
      const esperada = BANNER_LARGURA / BANNER_ALTURA;
      if (Math.abs(img.naturalWidth / img.naturalHeight - esperada) / esperada > 0.02) {
        toast.warning(
          `A imagem tem ${img.naturalWidth}×${img.naturalHeight}. O ideal é ${BANNER_LARGURA}×${BANNER_ALTURA} (vertical, 4:5) — fora disso as bordas são cortadas.`
        );
      }
    };
    img.src = url;
  }

  function removerBanner() {
    setNovoBanner(null);
    setPrevia(null);
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!valores.dataInicio || !valores.dataFim) {
      toast.error("Escolha as datas do torneio.");
      return;
    }
    if (
      !valores.inscricoesAbremData ||
      !valores.inscricoesAbremHora ||
      !valores.inscricoesFechamData ||
      !valores.inscricoesFechamHora
    ) {
      toast.error("Escolha quando as inscrições abrem e fecham.");
      return;
    }
    const destaqueAte =
      valores.destaqueAteData && valores.destaqueAteHora
        ? `${valores.destaqueAteData}T${valores.destaqueAteHora}`
        : "";
    startTransition(async () => {
      const resultado = await salvarTorneio(
        {
          torneioId: torneio.id,
          nome: valores.nome,
          slug: valores.slug,
          descricao: valores.descricao,
          doacao: valores.doacao,
          dataInicio: valores.dataInicio,
          dataFim: valores.dataFim,
          inscricoesAbrem: `${valores.inscricoesAbremData}T${valores.inscricoesAbremHora}`,
          inscricoesFecham: `${valores.inscricoesFechamData}T${valores.inscricoesFechamHora}`,
          maxCategoriasAtleta: valores.maxCategoriasAtleta || undefined,
          destaqueHome: valores.destaqueHome,
          destaqueAte,
          status: valores.status,
        },
        novoBanner
      );
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Torneio atualizado.");
      setNovoBanner(undefined);
      router.refresh();
    });
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4 rounded-xl border bg-background p-4">
      <h2 className="font-heading text-lg font-bold">Dados do torneio</h2>

      <div className="flex flex-col gap-1.5">
        <Label>
          Banner ({BANNER_LARGURA}×{BANNER_ALTURA}, vertical, JPG ou WebP até 1 MB)
        </Label>
        <div
          role="button"
          tabIndex={bannerUploadHabilitado ? 0 : -1}
          aria-label={previa ? "Trocar banner" : "Escolher banner"}
          aria-disabled={!bannerUploadHabilitado}
          onClick={() => bannerUploadHabilitado && inputBanner.current?.click()}
          onKeyDown={(e) => {
            if (!bannerUploadHabilitado || (e.key !== "Enter" && e.key !== " ")) return;
            e.preventDefault();
            inputBanner.current?.click();
          }}
          className={cn(
            "group relative aspect-[4/5] w-full max-w-48 overflow-hidden rounded-lg border bg-muted",
            bannerUploadHabilitado ? "cursor-pointer" : "cursor-not-allowed opacity-70",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          )}
        >
          {previa ? (
            <Image src={previa} alt="Banner do torneio" fill sizes="192px" unoptimized className="object-cover" />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageIcon className="size-6" aria-hidden />
              <span className="text-xs">Sem banner</span>
            </div>
          )}
          {bannerUploadHabilitado && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="size-5" aria-hidden />
            </div>
          )}
          {previa && bannerUploadHabilitado && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removerBanner();
              }}
              aria-label="Remover banner"
              className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-background text-foreground shadow-sm hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
        <input
          ref={inputBanner}
          type="file"
          accept="image/jpeg,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={escolherBanner}
        />
        {!bannerUploadHabilitado && (
          <p className="text-xs text-muted-foreground">
            Envio de banner desativado — falta configurar BLOB_READ_WRITE_TOKEN no servidor.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="torneio-nome">Nome</Label>
        <Input
          id="torneio-nome"
          required
          minLength={2}
          value={valores.nome}
          onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="torneio-slug">Slug (link público)</Label>
        <Input
          id="torneio-slug"
          required
          value={valores.slug}
          onChange={(e) => setValores((v) => ({ ...v, slug: slugify(e.target.value) }))}
        />
        <p className="text-xs text-muted-foreground">/torneios/{valores.slug || "…"}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="torneio-descricao">Descrição / regulamento</Label>
        <Textarea
          id="torneio-descricao"
          rows={4}
          value={valores.descricao}
          onChange={(e) => setValores((v) => ({ ...v, descricao: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="torneio-doacao">Doação (opcional)</Label>
        <Input
          id="torneio-doacao"
          placeholder="1 kg de alimento não perecível"
          value={valores.doacao}
          onChange={(e) => setValores((v) => ({ ...v, doacao: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Começa</Label>
          <SeletorData
            valor={valores.dataInicio}
            onAlterar={(dataInicio) => setValores((v) => ({ ...v, dataInicio }))}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Termina</Label>
          <SeletorData
            valor={valores.dataFim}
            onAlterar={(dataFim) => setValores((v) => ({ ...v, dataFim }))}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Inscrições abrem</Label>
        <div className="flex gap-2">
          <SeletorData
            valor={valores.inscricoesAbremData}
            onAlterar={(data) => setValores((v) => ({ ...v, inscricoesAbremData: data }))}
            className="flex-1"
          />
          <Input
            type="time"
            required
            aria-label="Horário em que as inscrições abrem"
            className="h-11 w-28 shrink-0"
            value={valores.inscricoesAbremHora}
            onChange={(e) => setValores((v) => ({ ...v, inscricoesAbremHora: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Inscrições fecham</Label>
        <div className="flex gap-2">
          <SeletorData
            valor={valores.inscricoesFechamData}
            onAlterar={(data) => setValores((v) => ({ ...v, inscricoesFechamData: data }))}
            className="flex-1"
          />
          <Input
            type="time"
            required
            aria-label="Horário em que as inscrições fecham"
            className="h-11 w-28 shrink-0"
            value={valores.inscricoesFechamHora}
            onChange={(e) => setValores((v) => ({ ...v, inscricoesFechamHora: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="torneio-max-categorias">Categorias por atleta</Label>
          <Input
            id="torneio-max-categorias"
            type="number"
            min="1"
            max="20"
            placeholder="Sem limite"
            value={valores.maxCategoriasAtleta}
            onChange={(e) => setValores((v) => ({ ...v, maxCategoriasAtleta: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">Vazio = sem limite.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="torneio-status">Situação</Label>
          <Select
            value={valores.status}
            onValueChange={(status) => setValores((v) => ({ ...v, status: status as StatusTorneio }))}
          >
            <SelectTrigger id="torneio-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_TORNEIO.map(({ valor, label }) => (
                <SelectItem key={valor} value={valor}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={valores.destaqueHome}
            onChange={(e) => setValores((v) => ({ ...v, destaqueHome: e.target.checked }))}
            className="size-4 accent-primary"
          />
          Destacar na home
        </label>
        {valores.destaqueHome && (
          <div className="flex flex-col gap-1.5">
            <Label>Até quando (opcional)</Label>
            <div className="flex gap-2">
              <SeletorData
                valor={valores.destaqueAteData}
                onAlterar={(data) => setValores((v) => ({ ...v, destaqueAteData: data }))}
                className="flex-1"
              />
              <Input
                type="time"
                aria-label="Horário em que o destaque sai da home"
                className="h-11 w-28 shrink-0"
                value={valores.destaqueAteHora}
                onChange={(e) => setValores((v) => ({ ...v, destaqueAteHora: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">Vazio = some da home no fim do torneio.</p>
          </div>
        )}
      </div>

      <Button type="submit" className="h-11 self-start" disabled={salvando}>
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
