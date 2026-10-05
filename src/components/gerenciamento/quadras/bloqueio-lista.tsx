"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarDataLonga, formatarHora } from "@/lib/format";
import { removerBloqueio } from "@/features/bloqueios/actions/remover-bloqueio";
import type { BloqueioFuturo } from "@/features/bloqueios/actions/listar-bloqueios";

export function BloqueioLista({
  bloqueiosIniciais,
}: {
  bloqueiosIniciais: BloqueioFuturo[];
}) {
  const [bloqueios, setBloqueios] = useState(bloqueiosIniciais);
  const [removendo, startTransition] = useTransition();

  function remover(id: string) {
    startTransition(async () => {
      const resultado = await removerBloqueio(id);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      setBloqueios((atual) => atual.filter((b) => b.id !== id));
      toast.success("Bloqueio removido.");
    });
  }

  if (bloqueios.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum bloqueio agendado.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {bloqueios.map((bloqueio) => (
        <li
          key={bloqueio.id}
          className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
        >
          <div>
            <p className="font-medium">{bloqueio.quadra.nome}</p>
            <p className="text-muted-foreground capitalize">
              {formatarDataLonga(bloqueio.inicio)} · {formatarHora(bloqueio.inicio)} às{" "}
              {formatarHora(bloqueio.fim)}
            </p>
            {bloqueio.motivo && (
              <p className="text-muted-foreground">{bloqueio.motivo}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={removendo}
            onClick={() => remover(bloqueio.id)}
            aria-label="Remover bloqueio"
          >
            <Trash2 className="text-destructive" aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  );
}
