import { PIX_CHAVE_ARENA, PIX_TITULAR_ARENA } from "@/lib/constants";

// Instrução de pagamento manual (docs/TORNEIOS.md): a vaga fica reservada
// até a arena confirmar o Pix à mão. Usado na inscrição e em Minhas
// inscrições (inscrição PENDENTE). Sem as duas variáveis configuradas, cai
// num texto genérico.
export function PixInstrucoes() {
  const configurado = PIX_CHAVE_ARENA && PIX_TITULAR_ARENA;

  return (
    <div className="rounded-xl border bg-muted/40 p-3 text-sm">
      <p className="font-medium">Como pagar</p>
      {configurado ? (
        <p className="text-muted-foreground">
          Pix para <span className="font-medium text-foreground">{PIX_TITULAR_ARENA}</span>, chave{" "}
          <span className="font-medium text-foreground">{PIX_CHAVE_ARENA}</span>. Envie o comprovante
          pro WhatsApp da arena — a vaga fica reservada até a arena confirmar o pagamento.
        </p>
      ) : (
        <p className="text-muted-foreground">
          Fale com a arena para combinar o pagamento. A vaga fica reservada até a arena confirmar.
        </p>
      )}
    </div>
  );
}
