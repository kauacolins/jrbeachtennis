"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { formatarDataExtensaISO } from "@/lib/datas";
import { formatarPreco, minutosParaHora } from "@/lib/format";
import { cancelarReservaAdmin } from "@/features/reservas/actions/cancelar-reserva-admin";
import { marcarReservaPago } from "@/features/reservas/actions/marcar-reserva-pago";
import { marcarNaoCompareceu } from "@/features/reservas/actions/marcar-nao-compareceu";
import type { AgendaBloco } from "@/features/gerenciamento/actions/obter-agenda-dia";

const STATUS_INFO: Record<string, { label: string; className: string }> = {
  PENDENTE_PAGAMENTO: {
    label: "Aguardando Pix",
    className: "bg-warning text-warning-foreground",
  },
  CONFIRMADA: { label: "Confirmada", className: "bg-accent text-accent-foreground" },
  CONCLUIDA: { label: "Concluída", className: "bg-secondary text-secondary-foreground" },
  NAO_COMPARECEU: {
    label: "Não compareceu",
    className: "bg-destructive/10 text-destructive",
  },
  CANCELADA: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
};

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

// RF15: detalhe de uma reserva clicada na agenda, com as ações do admin —
// marcar pago, marcar não compareceu, cancelar (sem o prazo de 24h do
// cliente) e um atalho pra falar direto com o cliente no WhatsApp. Modal
// centralizado: é uma interação curta de "ver e decidir", não um espaço de
// trabalho persistente, então não compensa usar um painel lateral. As
// mutações atualizam o estado local (ver AgendaDoDia) igual ao padrão já
// usado em ReservaCard/BloqueioLista, sem esperar revalidação.
export function ReservaDetalheDialog({
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

  const bloco = selecao?.bloco ?? null;
  const quadraNome = selecao?.quadraNome;
  const status = bloco?.status ?? "CONFIRMADA";
  const info = STATUS_INFO[status] ?? STATUS_INFO.CONFIRMADA;
  const naoCompareceu = status === "NAO_COMPARECEU";
  const cancelada = status === "CANCELADA";

  const whatsapp = bloco?.subtitulo
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

  return (
    <Dialog open={bloco !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {bloco && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">{bloco.titulo}</DialogTitle>
              <div className="flex items-center gap-2 pt-0.5">
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
            </DialogHeader>

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
              <DialogFooter className="flex-col gap-3 sm:flex-col">
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
                    titulo={
                      naoCompareceu
                        ? "Desfazer o não comparecimento?"
                        : "Marcar como não compareceu?"
                    }
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
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
