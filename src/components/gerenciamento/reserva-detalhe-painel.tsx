"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CalendarCheck,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatarDataCurtaISO, formatarDataExtensaISO } from "@/lib/datas";
import { formatarPreco, minutosParaHora } from "@/lib/format";
import { cancelarReservaAdmin } from "@/features/reservas/actions/cancelar-reserva-admin";
import { marcarReservaPago } from "@/features/reservas/actions/marcar-reserva-pago";
import { marcarNaoCompareceu } from "@/features/reservas/actions/marcar-nao-compareceu";
import type { AgendaBloco } from "@/features/gerenciamento/actions/obter-agenda-dia";
import { STATUS_RESERVA_INFO as STATUS_INFO } from "@/lib/status-reserva";

export interface SelecaoAgenda {
  bloco: AgendaBloco;
  quadraNome: string;
}

/** Chave Pix da arena (env do servidor), pra ir junto na cobrança. */
export interface PixArena {
  chave: string;
  titular: string;
}

// Telefone já vem formatado (ver obterAgendaDia); limpa de volta pra dígitos
// e monta o link do WhatsApp com DDI 55.
function linkWhatsapp(telefoneFormatado: string, mensagem: string) {
  const digitos = telefoneFormatado.replace(/\D/g, "");
  if (!digitos) return null;
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

interface MensagemWhatsapp {
  id: string;
  label: string;
  descricao: string;
  icone: typeof MessageCircle;
  href: string;
}

// Modelos prontos de mensagem pro operador mandar do balcão sem digitar:
// confirmação do horário e cobrança (só enquanto está a pagar), mais uma
// genérica pra qualquer outro assunto.
function mensagensWhatsapp({
  bloco,
  quadraNome,
  dataISO,
  pix,
}: {
  bloco: AgendaBloco;
  quadraNome?: string;
  dataISO: string;
  pix?: PixArena | null;
}): MensagemWhatsapp[] {
  if (!bloco.subtitulo || bloco.status === "CANCELADA") return [];

  const saudacao = `Olá${bloco.titulo ? `, ${bloco.titulo}` : ""}! Aqui é da Arena JR.`;
  const data = formatarDataExtensaISO(dataISO);
  const inicio = minutosParaHora(bloco.inicioMin);
  const fim = minutosParaHora(bloco.fimMin);
  const valor =
    typeof bloco.valorCentavos === "number" ? formatarPreco(bloco.valorCentavos) : null;

  const modelos: Omit<MensagemWhatsapp, "href">[] = [];
  const textos: string[] = [];

  modelos.push({
    id: "confirmar",
    label: "Confirmar horário",
    descricao: "Data, horário e quadra da reserva",
    icone: CalendarCheck,
  });
  textos.push(
    [
      saudacao,
      "Passando pra confirmar sua reserva:",
      "",
      `📅 ${data}`,
      `⏰ ${inicio} às ${fim}`,
      quadraNome ? `📍 ${quadraNome}` : null,
      "",
      "Te esperamos!",
    ]
      .filter((linha) => linha !== null)
      .join("\n")
  );

  if (!bloco.pago) {
    modelos.push({
      id: "pagamento",
      label: "Solicitar pagamento",
      descricao: pix ? "Valor e chave Pix da arena" : "Valor em aberto da reserva",
      icone: Banknote,
    });
    textos.push(
      [
        saudacao,
        `Sua reserva de ${data}, das ${inicio} às ${fim}${quadraNome ? ` (${quadraNome})` : ""}, está com o pagamento${valor ? ` de ${valor}` : ""} em aberto.`,
        "",
        pix ? `Pix: ${pix.chave}` : null,
        pix ? `Titular: ${pix.titular}` : null,
        pix ? "" : null,
        "Assim que pagar, é só mandar o comprovante por aqui. Obrigado!",
      ]
        .filter((linha) => linha !== null)
        .join("\n")
    );
  }

  modelos.push({
    id: "livre",
    label: "Outra mensagem",
    descricao: "Abre a conversa só com a saudação",
    icone: MessageCircle,
  });
  textos.push(`${saudacao} Sobre sua reserva de ${data} às ${inicio}: `);

  return modelos.flatMap((modelo, i) => {
    const href = linkWhatsapp(bloco.subtitulo as string, textos[i]);
    return href ? [{ ...modelo, href }] : [];
  });
}

function OpcoesWhatsapp({
  mensagens,
  className,
}: {
  mensagens: MensagemWhatsapp[];
  className?: string;
}) {
  if (mensagens.length === 0) return null;
  return (
    <section className={cn("flex flex-col gap-1.5", className)} aria-label="Enviar no WhatsApp">
      <h3 className="text-xs font-medium text-muted-foreground">Enviar no WhatsApp</h3>
      <ul className="divide-y overflow-hidden rounded-xl border">
        {mensagens.map(({ id, label, descricao, icone: Icone, href }) => (
          <li key={id}>
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center gap-3 px-3 py-2 outline-none transition-colors hover:bg-muted focus-visible:bg-muted active:bg-muted"
            >
              <Icone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="truncate text-xs text-muted-foreground">{descricao}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function linkTelefone(telefoneFormatado: string) {
  const digitos = telefoneFormatado.replace(/\D/g, "");
  return digitos ? `tel:+${digitos.startsWith("55") ? digitos : `55${digitos}`}` : null;
}

function Dado({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{valor}</dd>
    </>
  );
}

// RF15: detalhe de uma reserva clicada na agenda — marcar pago, marcar não
// compareceu, cancelar (sem o prazo de 24h do cliente) e um atalho pra
// WhatsApp. admin-panel-ui: painel fixo à direita no desktop (não cobre a
// grade, dá pra comparar com o resto da agenda enquanto decide) e gaveta
// subindo de baixo no celular — fica na zona do polegar, mantém a lista
// visível atrás e deixa as ações fixas no rodapé, sem precisar rolar. As
// mutações atualizam o estado local (ver AgendaDoDia), sem esperar
// revalidação.
export function ReservaDetalhePainel({
  selecao,
  dataISO,
  pix,
  onOpenChange,
  onAtualizado,
}: {
  selecao: SelecaoAgenda | null;
  dataISO: string;
  pix?: PixArena | null;
  onOpenChange: (aberto: boolean) => void;
  onAtualizado: (id: string, patch: Partial<AgendaBloco>) => void;
}) {
  const [emAndamento, startTransition] = useTransition();
  const isMobile = useIsMobile();

  const bloco = selecao?.bloco ?? null;
  const quadraNome = selecao?.quadraNome;
  const status = bloco?.status ?? "CONFIRMADA";
  const info = STATUS_INFO[status] ?? STATUS_INFO.CONFIRMADA;
  const naoCompareceu = status === "NAO_COMPARECEU";
  const cancelada = status === "CANCELADA";

  function alternarPago() {
    if (!bloco) return;
    const novoPago = !bloco.pago;
    startTransition(async () => {
      const resultado = await marcarReservaPago(bloco.id, novoPago);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      onAtualizado(bloco.id, { pago: novoPago });
      toast.success(novoPago ? "Marcado como pago." : "Marcado como não pago.");
    });
  }

  function alternarNaoCompareceu() {
    if (!bloco) return;
    const marcar = !naoCompareceu;
    startTransition(async () => {
      const resultado = await marcarNaoCompareceu(bloco.id, marcar);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      onAtualizado(bloco.id, { status: marcar ? "NAO_COMPARECEU" : "CONFIRMADA" });
      toast.success(marcar ? "Marcado como não compareceu." : "Desfeito.");
    });
  }

  function cancelar() {
    if (!bloco) return;
    startTransition(async () => {
      const resultado = await cancelarReservaAdmin(bloco.id);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      onAtualizado(bloco.id, { status: "CANCELADA" });
      toast.success("Reserva cancelada.");
    });
  }

  if (!bloco) return null;

  const mensagens = mensagensWhatsapp({ bloco, quadraNome, dataISO, pix });

  const badges = (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={info.className}>{info.label}</Badge>
      {!cancelada && (
        <Badge
          variant={bloco.pago ? "outline" : "default"}
          className={bloco.pago ? "" : "bg-warning text-warning-foreground"}
        >
          {bloco.pago ? "Pago" : "A pagar"}
        </Badge>
      )}
    </div>
  );

  const botaoPago = (className?: string) => (
    <ConfirmarBotao
      className={className}
      variant="default"
      label={bloco.pago ? "Marcar não pago" : "Marcar como pago"}
      titulo={bloco.pago ? "Marcar como não pago?" : "Marcar como pago?"}
      descricao={
        bloco.pago
          ? "O pagamento volta a aparecer como pendente."
          : "Confirma que o pagamento dessa reserva foi recebido."
      }
      textoConfirmar="Confirmar"
      textoConfirmando="Salvando…"
      disabled={emAndamento}
      onConfirmar={alternarPago}
    />
  );

  const botaoNaoCompareceu = (className?: string) => (
    <ConfirmarBotao
      className={className}
      variant="outline"
      label={naoCompareceu ? "Desfazer" : "Não compareceu"}
      titulo={naoCompareceu ? "Desfazer o não comparecimento?" : "Marcar como não compareceu?"}
      descricao={
        naoCompareceu
          ? "A reserva volta a aparecer como confirmada."
          : "Confirma que o cliente não apareceu nesse horário."
      }
      textoConfirmar="Confirmar"
      textoConfirmando="Salvando…"
      disabled={emAndamento}
      onConfirmar={alternarNaoCompareceu}
    />
  );

  const botaoCancelar = (
    variant: "ghost" | "destructive",
    className?: string
  ) => (
    <ConfirmarBotao
      className={className}
      variant={variant}
      actionVariant="destructive"
      label="Cancelar reserva"
      titulo="Cancelar essa reserva?"
      descricao="Libera o horário na agenda. Essa ação não pode ser desfeita."
      textoConfirmar="Cancelar reserva"
      textoConfirmando="Cancelando…"
      disabled={emAndamento}
      onConfirmar={cancelar}
    />
  );

  if (isMobile) {
    const telefone = bloco.subtitulo ? linkTelefone(bloco.subtitulo) : null;

    return (
      <Sheet open onOpenChange={onOpenChange}>
        {/* Subida com a curva de desaceleração das gavetas do iOS (rápida no
            começo, assentando devagar), sem o fade padrão do Sheet — que
            deixava a gaveta "aparecer" em vez de subir. A saída é mais curta
            e acelera, como quem empurra pra baixo. O conteúdo entra em
            cascata logo depois. */}
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-100 data-starting-style:opacity-100 data-ending-style:duration-200 data-ending-style:ease-in motion-reduce:transition-none"
        >
          <SheetHeader className="gap-2 pr-12">
            <SheetTitle className="text-xl font-bold">{bloco.titulo}</SheetTitle>
            <SheetDescription className="sr-only">Detalhes e ações da reserva</SheetDescription>
            {badges}
          </SheetHeader>

          <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:delay-100">
            {/* Resumo em blocos: é o que o operador confere de relance no
                balcão, então vem grande e antes de qualquer ação. */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5 rounded-xl bg-muted/60 p-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden />
                  <span className="capitalize">{formatarDataCurtaISO(dataISO)}</span>
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {minutosParaHora(bloco.inicioMin)}–{minutosParaHora(bloco.fimMin)}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-muted/60 p-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden />
                  Quadra
                </span>
                <span className="truncate text-lg font-semibold">{quadraNome}</span>
              </div>
            </div>

            {typeof bloco.valorCentavos === "number" && (
              <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span className="text-base font-semibold tabular-nums">
                  {formatarPreco(bloco.valorCentavos)}
                </span>
              </div>
            )}

            {telefone && (
              <div className="flex items-center gap-2 rounded-xl border p-2 pl-3">
                <span className="min-w-0 flex-1 truncate text-sm tabular-nums">{bloco.subtitulo}</span>
                <Button
                  variant="outline"
                  className="h-10 gap-1.5 px-3"
                  render={<a href={telefone} />}
                  nativeButton={false}
                >
                  <Phone aria-hidden />
                  Ligar
                </Button>
              </div>
            )}

            <OpcoesWhatsapp mensagens={mensagens} />
          </div>

          {!cancelada && (
            <SheetFooter className="gap-2 border-t motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:delay-200">
              {botaoPago("h-11 w-full")}
              <div className="grid grid-cols-2 gap-2">
                {botaoNaoCompareceu("h-11")}
                {botaoCancelar("destructive", "h-11")}
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="flex w-96 shrink-0 flex-col gap-4 border-l pl-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">{bloco.titulo}</h2>
        <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
          <X aria-hidden />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>

      {badges}

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
        <Dado label="Quadra" valor={quadraNome} />
        <Dado
          label="Horário"
          valor={
            <span className="capitalize">
              {formatarDataExtensaISO(dataISO)} · {minutosParaHora(bloco.inicioMin)}–
              {minutosParaHora(bloco.fimMin)}
            </span>
          }
        />
        {bloco.subtitulo && <Dado label="Telefone" valor={bloco.subtitulo} />}
        {typeof bloco.valorCentavos === "number" && (
          <Dado
            label="Valor"
            valor={<span className="font-medium">{formatarPreco(bloco.valorCentavos)}</span>}
          />
        )}
      </dl>

      <OpcoesWhatsapp mensagens={mensagens} />

      {!cancelada && (
        <div className="flex flex-col gap-3">
          <div className="flex w-full gap-2">
            {botaoPago("flex-1")}
            {botaoNaoCompareceu("flex-1")}
          </div>

          <Separator />

          {botaoCancelar("ghost", "w-full text-destructive hover:text-destructive")}
        </div>
      )}
    </aside>
  );
}
