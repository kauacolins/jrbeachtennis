"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BuscarCliente } from "@/components/gerenciamento/balcao/buscar-cliente";
import { adicionarDayUseComanda } from "@/features/comandas/actions/adicionar-day-use";
import type { ClienteBalcao } from "@/features/clientes/actions/buscar-clientes";

// RF36: o passe é de uma pessoa (um por dia, R$ 0 com mensal), então aqui o
// operador escolhe ou cadastra o cliente — a busca já vem com o nome da
// comanda. A comanda continua só com o nome.
export function DayUseComandaDialog({
  aberto,
  onOpenChange,
  comandaId,
  nomeComanda,
  onAdicionado,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  comandaId: string;
  nomeComanda: string;
  onAdicionado: () => void;
}) {
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function selecionar(cliente: ClienteBalcao) {
    setErro(null);
    startTransition(async () => {
      const resultado = await adicionarDayUseComanda({ comandaId, clienteId: cliente.id });
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      toast.success(
        resultado.cobertoPeloPlano
          ? `Day use de ${cliente.nome} lançado (coberto pelo mensal).`
          : `Day use de ${cliente.nome} lançado.`
      );
      onOpenChange(false);
      onAdicionado();
    });
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        if (!valor) setErro(null);
        onOpenChange(valor);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Day use de hoje</DialogTitle>
          <DialogDescription>
            Escolha quem vai usar o day use. Com plano mensal ativo, sai por R$ 0.
          </DialogDescription>
        </DialogHeader>
        {aberto && (
          <BuscarCliente
            termoInicial={nomeComanda}
            acaoLabel="Lançar"
            pendente={pendente}
            onSelecionar={selecionar}
          />
        )}
        {erro && (
          <p className="text-sm text-destructive" aria-live="polite">
            {erro}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
