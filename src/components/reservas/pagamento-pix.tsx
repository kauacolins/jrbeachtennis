"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertCircle, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatarCpf } from "@/lib/format";
import { criarPagamentoPix } from "@/features/reservas/actions/criar-pagamento-pix";
import { consultarReserva } from "@/features/reservas/actions/consultar-reserva";

const INTERVALO_POLL_MS = 3000;

function tempoRestante(expiraEmISO: string) {
  return Math.max(0, new Date(expiraEmISO).getTime() - Date.now());
}

// Passo 2 da reserva com pagamento online (ver ResumoReserva): pede o CPF
// exigido pelo Mercado Pago pra gerar o Pix, mostra o QR code + código
// copia-e-cola, e aguarda a confirmação. O polling em consultarReserva
// existe porque o webhook não alcança localhost em desenvolvimento — em
// produção os dois convivem, o que confirmar primeiro vence.
export function PagamentoPix({
  reservaId,
  expiraEmISO,
  onConfirmado,
  onExpirado,
}: {
  reservaId: string;
  expiraEmISO: string;
  onConfirmado: () => void;
  onExpirado: () => void;
}) {
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();
  const [pix, setPix] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [restanteMs, setRestanteMs] = useState(() => tempoRestante(expiraEmISO));

  function gerarPix(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    startTransition(async () => {
      const resultado = await criarPagamentoPix({ reservaId, cpf });
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      if (resultado.aprovado) {
        onConfirmado();
        return;
      }
      setPix({ qrCode: resultado.qrCode, qrCodeBase64: resultado.qrCodeBase64 });
    });
  }

  // Contagem regressiva — só decoração visual, quem decide de verdade que
  // expirou é o servidor (expirarReservasPendentes/consultarReserva).
  useEffect(() => {
    const intervalo = setInterval(() => {
      setRestanteMs(tempoRestante(expiraEmISO));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [expiraEmISO]);

  useEffect(() => {
    if (!pix) return;
    let cancelado = false;

    const intervalo = setInterval(async () => {
      const resultado = await consultarReserva(reservaId);
      if (cancelado || !resultado.ok) return;
      if (resultado.status === "CONFIRMADA") onConfirmado();
      if (resultado.status === "CANCELADA") onExpirado();
    }, INTERVALO_POLL_MS);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [pix, reservaId, onConfirmado, onExpirado]);

  useEffect(() => {
    if (restanteMs <= 0) onExpirado();
  }, [restanteMs, onExpirado]);

  function copiarCodigo() {
    if (!pix) return;
    navigator.clipboard.writeText(pix.qrCode).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  const minutos = Math.floor(restanteMs / 60_000);
  const segundos = Math.floor((restanteMs % 60_000) / 1000);

  if (!pix) {
    return (
      <form onSubmit={gerarPix} className="flex flex-col gap-3 px-4">
        <p className="text-sm text-muted-foreground">
          Falta só o CPF pra gerar o Pix da reserva.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pix-cpf">CPF</Label>
          <Input
            id="pix-cpf"
            inputMode="numeric"
            autoComplete="off"
            required
            value={formatarCpf(cpf)}
            onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
            className="h-11"
          />
        </div>

        {erro && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden />
            <AlertDescription aria-live="polite">{erro}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="h-11" disabled={enviando || cpf.length !== 11}>
          {enviando ? "Gerando Pix…" : "Gerar Pix"}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem base64 gerada pelo Mercado Pago, sem otimização a fazer */}
      <img
        src={`data:image/png;base64,${pix.qrCodeBase64}`}
        alt="QR Code do Pix"
        className="size-56 rounded-lg border p-2"
      />
      <p className="text-sm text-muted-foreground">
        Escaneie com o app do seu banco, ou copie o código abaixo.
      </p>
      <Button type="button" variant="outline" className="h-11 w-full" onClick={copiarCodigo}>
        {copiado ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copiado ? "Copiado!" : "Copiar código Pix"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Expira em {minutos}:{String(segundos).padStart(2, "0")} — a reserva
        libera o horário se não pagar a tempo.
      </p>
    </div>
  );
}
