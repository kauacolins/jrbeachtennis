"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  ChevronLeft,
  CupSoda,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Receipt,
  Sun,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClienteForm } from "@/components/gerenciamento/equipe/cliente-form";
import { modelosMensagemCliente } from "@/components/gerenciamento/clientes/mensagens-cliente";
import { FILTROS_CONSUMO, type FiltroConsumo } from "@/components/gerenciamento/clientes/filtros-consumo";
import type { PixArena } from "@/components/gerenciamento/reserva-detalhe-painel";
import { cn } from "@/lib/utils";
import { formatarDataCurtaISO } from "@/lib/datas";
import { formatarDataComAno, formatarHora, formatarPreco, formatarTelefone } from "@/lib/format";
import { linkWhatsapp } from "@/lib/whatsapp";
import type { ClienteDetalhe as Detalhe, ConsumoCliente, TipoConsumo } from "@/features/usuarios/actions/obter-cliente";

const ICONE_TIPO: Record<TipoConsumo, LucideIcon> = {
  RESERVA: CalendarCheck,
  DAY_USE: Sun,
  MENSAL: Sun,
  BAR: CupSoda,
  TORNEIO: Trophy,
};

function Estatistica({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5 rounded-xl border p-3", destaque ? "bg-warning/15" : "bg-accent")}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-heading text-xl font-bold tabular-nums">{valor}</span>
    </div>
  );
}

function dataConsumo(consumo: ConsumoCliente) {
  if (consumo.dataISO) return formatarDataCurtaISO(consumo.dataISO);
  if (consumo.tipo === "RESERVA") return `${formatarDataComAno(consumo.data)} · ${formatarHora(consumo.data)}`;
  return formatarDataComAno(consumo.data);
}

function BadgeConsumo({ consumo }: { consumo: ConsumoCliente }) {
  const classe = "rounded-full text-[11px]";
  if (consumo.cancelado) return <Badge className={cn(classe, "bg-muted text-muted-foreground")}>Cancelado</Badge>;
  if (consumo.status) return <Badge className={cn(classe, "bg-destructive/10 text-destructive")}>{consumo.status}</Badge>;
  if (consumo.pago) return <Badge className={cn(classe, "bg-accent text-accent-foreground")}>Pago</Badge>;
  return <Badge className={cn(classe, "bg-warning text-warning-foreground")}>A pagar</Badge>;
}

// Escolhe um modelo pronto, ajusta o texto se quiser e abre o WhatsApp.
// O texto fica editável porque o operador quase sempre completa alguma
// coisa (horário combinado, desconto, recado).
function EnviarMensagem({
  cliente,
  detalhe,
  siteUrl,
  pix,
}: {
  cliente: Detalhe["cliente"];
  detalhe: Detalhe;
  siteUrl: string;
  pix: PixArena | null;
}) {
  const modelos = modelosMensagemCliente(cliente.name, siteUrl, {
    emAberto: detalhe.emAberto,
    proximaReserva: detalhe.proximaReserva,
    mensalAtivoAte: detalhe.mensalAtivoAte,
    pix,
  });
  const [modeloId, setModeloId] = useState(modelos[0]?.id);
  const [texto, setTexto] = useState(modelos[0]?.texto ?? "");

  if (!cliente.telefone) {
    return (
      <section className="flex flex-col gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <h2 className="font-semibold text-foreground">Enviar mensagem</h2>
        Cliente sem telefone cadastrado. Edite o cadastro pra mandar mensagem pelo WhatsApp.
      </section>
    );
  }

  const href = texto.trim() ? linkWhatsapp(cliente.telefone, texto) : null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4" aria-labelledby="titulo-mensagem">
      <h2 id="titulo-mensagem" className="font-semibold">
        Enviar mensagem
      </h2>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Modelo de mensagem">
        {modelos.map(({ id, label, icone: Icone, texto: textoModelo }) => (
          <Button
            key={id}
            type="button"
            role="radio"
            aria-checked={modeloId === id}
            variant={modeloId === id ? "secondary" : "outline"}
            size="lg"
            className={cn(modeloId === id && "ring-2 ring-foreground/20")}
            onClick={() => {
              setModeloId(id);
              setTexto(textoModelo);
            }}
          >
            <Icone aria-hidden />
            {label}
          </Button>
        ))}
      </div>
      <Textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={7}
        aria-label="Texto da mensagem"
        className="text-sm"
      />
      <Button
        size="lg"
        className="w-full sm:w-fit"
        disabled={!href}
        nativeButton={false}
        render={<a href={href ?? undefined} target="_blank" rel="noopener noreferrer" />}
      >
        <MessageCircle aria-hidden />
        Abrir no WhatsApp
      </Button>
    </section>
  );
}

// Detalhe do cliente (Gerenciamento > Clientes > card): contato, resumo do
// que gastou, mensagens prontas pro WhatsApp e o histórico de consumo
// (reservas, day use/mensal, bar e torneios — ver obterCliente). O filtro
// do consumo fica na URL (?tipo=) sem recarregar a página.
export function ClienteDetalhe({
  detalhe,
  filtroInicial,
  siteUrl,
  pix,
}: {
  detalhe: Detalhe;
  filtroInicial: FiltroConsumo;
  siteUrl: string;
  pix: PixArena | null;
}) {
  const router = useRouter();
  const { cliente, consumos, resumo } = detalhe;
  const [editando, setEditando] = useState(false);
  const [filtro, setFiltro] = useState<FiltroConsumo>(filtroInicial);

  function trocarFiltro(valor: FiltroConsumo) {
    setFiltro(valor);
    const url = new URL(window.location.href);
    if (valor === "todos") url.searchParams.delete("tipo");
    else url.searchParams.set("tipo", valor);
    window.history.replaceState(null, "", url);
  }

  const tiposFiltro = FILTROS_CONSUMO.find((f) => f.valor === filtro)?.tipos;
  const visiveis = tiposFiltro ? consumos.filter((c) => tiposFiltro.includes(c.tipo)) : consumos;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Link
          href="/gerenciamento/clientes"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Clientes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-heading text-2xl font-bold">{cliente.name}</h1>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {cliente.telefone && (
                <a
                  href={`tel:+55${cliente.telefone.replace(/\D/g, "")}`}
                  className="flex items-center gap-1.5 tabular-nums hover:text-foreground"
                >
                  <Phone className="size-3.5" aria-hidden />
                  {formatarTelefone(cliente.telefone)}
                </a>
              )}
              <span className="flex min-w-0 items-center gap-1.5">
                <Mail className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{cliente.email}</span>
              </span>
              <span>Cliente desde {formatarDataComAno(cliente.createdAt)}</span>
            </p>
          </div>
          <Button variant="outline" size="lg" onClick={() => setEditando(true)}>
            <Pencil aria-hidden />
            Editar cadastro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Estatistica label="Total pago" valor={formatarPreco(resumo.pagoCentavos)} />
        <Estatistica
          label="Em aberto"
          valor={formatarPreco(resumo.emAbertoCentavos)}
          destaque={resumo.emAbertoCentavos > 0}
        />
        <Estatistica label="Reservas" valor={String(resumo.reservas)} />
        <Estatistica label="Day uses" valor={String(resumo.dayUses)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-4" aria-labelledby="titulo-consumo">
          <div className="flex flex-col gap-2">
            <h2 id="titulo-consumo" className="font-semibold">
              Consumo
            </h2>
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <Tabs value={filtro} onValueChange={(v) => trocarFiltro(v as FiltroConsumo)}>
                <TabsList variant="line">
                  {FILTROS_CONSUMO.map((f) => {
                    const total = f.tipos ? consumos.filter((c) => f.tipos!.includes(c.tipo)).length : consumos.length;
                    return (
                      <TabsTrigger key={f.valor} value={f.valor} className="data-active:after:bg-primary">
                        {f.label} ({total})
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {visiveis.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              <Receipt className="size-6" aria-hidden />
              {consumos.length === 0 ? "Esse cliente ainda não consumiu nada na arena." : "Nada nessa categoria."}
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {visiveis.map((consumo) => {
                const Icone = ICONE_TIPO[consumo.tipo];
                const conteudo = (
                  <>
                    <Icone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn("truncate font-medium", consumo.cancelado && "line-through")}>
                        {consumo.titulo}
                      </span>
                      <span className="truncate text-xs text-muted-foreground tabular-nums">
                        {[dataConsumo(consumo), consumo.detalhe].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums">
                        {consumo.tipo === "DAY_USE" && consumo.valorCentavos === 0
                          ? "Mensal"
                          : formatarPreco(consumo.valorCentavos)}
                      </span>
                      <BadgeConsumo consumo={consumo} />
                    </span>
                  </>
                );
                const classe = cn(
                  "flex items-center gap-3 rounded-md border border-l-4 px-3 py-2.5 text-sm",
                  consumo.cancelado
                    ? "border-l-muted-foreground/40"
                    : consumo.pago
                      ? "border-l-primary"
                      : "border-l-warning"
                );
                return (
                  <li key={consumo.id}>
                    {consumo.comandaId ? (
                      <Link
                        href={`/gerenciamento/comandas/${consumo.comandaId}`}
                        className={cn(classe, "outline-none transition-colors hover:bg-muted focus-visible:bg-muted")}
                      >
                        {conteudo}
                      </Link>
                    ) : (
                      <div className={classe}>{conteudo}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Itens de bar aparecem quando a comanda teve uma reserva ou day use do cliente.
          </p>
        </section>

        <EnviarMensagem cliente={cliente} detalhe={detalhe} siteUrl={siteUrl} pix={pix} />
      </div>

      <ClienteForm
        aberto={editando}
        onOpenChange={setEditando}
        cliente={cliente}
        onSalvo={() => router.refresh()}
      />
    </div>
  );
}
