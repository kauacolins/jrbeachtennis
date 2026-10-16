"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatarDataExtensaISO } from "@/lib/datas";
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

// Telefone já vem formatado (ver obterAgendaDia); limpa de volta pra dígitos
// e monta o link do WhatsApp com DDI 55.
function linkWhatsapp(telefoneFormatado: string, mensagem: string) {
  const digitos = telefoneFormatado.replace(/\D/g, "");
  if (!digitos) return null;
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
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
// (Sheet) no celular, onde não tem espaço pra um painel ao lado. As
// mutações atualizam o estado local (ver AgendaDoDia), sem esperar
// revalidação.
export function ReservaDetalhePainel({
  selecao,
  dataISO,
  onOpenChange,
  onAtualizado,
}: {
  selecao: SelecaoAgenda | null;
  dataISO: string;
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

  const whatsapp =
    bloco?.subtitulo && dataISO
      ? linkWhatsapp(
          bloco.subtitulo,
          `Olá${bloco.titulo ? ` ${bloco.titulo}` : ""}! Aqui é da Arena JR, sobre sua reserva em ${formatarDataExtensaISO(dataISO)} às ${minutosParaHora(bloco.inicioMin)}.`
        )
      : null;

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

  const corpo = (
    <>
      <div className="flex items-center gap-2">
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

      {whatsapp && (
        <Button
          variant="outline"
          className="w-full"
          render={<Link href={whatsapp} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
        >
          <MessageCircle className="size-4" aria-hidden />
          Enviar mensagem no WhatsApp
        </Button>
      )}

      {!cancelada && (
        <div className="flex flex-col gap-3">
          <div className="flex w-full gap-2">
            <ConfirmarBotao
              className="flex-1"
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
            <ConfirmarBotao
              className="flex-1"
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
          </div>

          <Separator />

          <ConfirmarBotao
            className="w-full text-destructive hover:text-destructive"
            variant="ghost"
            actionVariant="destructive"
            label="Cancelar reserva"
            titulo="Cancelar essa reserva?"
            descricao="Libera o horário na agenda. Essa ação não pode ser desfeita."
            textoConfirmar="Cancelar reserva"
            textoConfirmando="Cancelando…"
            disabled={emAndamento}
            onConfirmar={cancelar}
          />
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-lg">{bloco.titulo}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">{corpo}</div>
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
      {corpo}
    </aside>
  );
}
