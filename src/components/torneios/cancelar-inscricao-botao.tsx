"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { cancelarInscricao } from "@/features/torneios/actions/cancelar-inscricao";

export function CancelarInscricaoBotao({ inscricaoId }: { inscricaoId: string }) {
  const router = useRouter();

  async function cancelar() {
    const resultado = await cancelarInscricao(inscricaoId);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Inscrição cancelada.");
    router.refresh();
  }

  return (
    <ConfirmarBotao
      size="sm"
      variant="outline"
      actionVariant="destructive"
      label="Cancelar inscrição"
      titulo="Cancelar essa inscrição?"
      descricao="Essa ação não pode ser desfeita."
      textoConfirmar="Cancelar"
      textoConfirmando="Cancelando…"
      onConfirmar={cancelar}
      className="self-start"
    />
  );
}
