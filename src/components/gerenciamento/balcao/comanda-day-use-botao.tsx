"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { BuscarCliente } from "@/components/gerenciamento/balcao/buscar-cliente";
import { abrirComandaDayUse } from "@/features/comandas/actions/abrir-comanda-day-use";
import type { ClienteBalcao } from "@/features/clientes/actions/buscar-clientes";

// Botão "Comanda com day use" (dashboard e tela de Day use): escolhe ou
// cadastra o cliente, abre a comanda no nome dele já com o day use de hoje
// e leva pra comanda — pra continuar lançando bar ou fechar na hora.
export function ComandaDayUseBotao({
  variant = "outline",
  className,
}: {
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function selecionar(cliente: ClienteBalcao) {
    setErro(null);
    startTransition(async () => {
      const resultado = await abrirComandaDayUse(cliente.id);
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      const plano = resultado.cobertoPeloPlano ? " (coberto pelo mensal)" : "";
      toast.success(
        resultado.jaTinhaComanda
          ? `Day use lançado na comanda aberta de ${cliente.nome}${plano}.`
          : `Comanda de ${cliente.nome} aberta com day use${plano}.`
      );
      setAberto(false);
      router.push(`/gerenciamento/comandas/${resultado.comandaId}`);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={cn("max-md:h-11", className)}
        onClick={() => {
          setErro(null);
          setAberto(true);
        }}
      >
        <Sun aria-hidden />
        Comanda com day use
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comanda com day use</DialogTitle>
            <DialogDescription>
              Escolha quem vai usar o day use de hoje. A comanda abre no nome dele; com plano mensal
              ativo, o day use sai por R$ 0.
            </DialogDescription>
          </DialogHeader>
          {aberto && <BuscarCliente acaoLabel="Abrir comanda" pendente={pendente} onSelecionar={selecionar} />}
          {erro && (
            <p className="text-sm text-destructive" aria-live="polite">
              {erro}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
