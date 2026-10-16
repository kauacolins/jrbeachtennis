"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Web Share API (mobile) com fallback de copiar link (desktop) — catalog-ui
// pede um jeito fácil de compartilhar a página de detalhe.
export function CompartilharBotao({ titulo, texto }: { titulo: string; texto?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
      } catch {
        // cancelado pela pessoa no painel nativo — não é erro
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className="rounded-full"
      onClick={compartilhar}
      aria-label="Compartilhar torneio"
    >
      {copiado ? <Check /> : <Share2 />}
    </Button>
  );
}
