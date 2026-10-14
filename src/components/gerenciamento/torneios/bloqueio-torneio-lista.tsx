"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { BloqueioTorneioFormDialog } from "@/components/gerenciamento/torneios/bloqueio-torneio-form-dialog";
import { formatarDataCurta, formatarHora } from "@/lib/format";
import { removerBloqueioTorneio } from "@/features/torneios/actions/remover-bloqueio-torneio";
import type { BloqueioDoTorneio } from "@/features/torneios/actions/obter-torneio";
import type { QuadraAdmin } from "@/features/quadras/actions/listar-quadras-admin";

// Quadras reservadas pro torneio (docs/TORNEIOS.md, passo 3): a agenda de
// reservas deixa de oferecer esses horários enquanto o bloqueio existir.
export function BloqueioTorneioLista({
  torneioId,
  bloqueios,
  quadras,
}: {
  torneioId: string;
  bloqueios: BloqueioDoTorneio[];
  quadras: QuadraAdmin[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  async function remover(bloqueioId: string) {
    const resultado = await removerBloqueioTorneio(bloqueioId, torneioId);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Bloqueio removido.");
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold">Quadras bloqueadas</h2>
        <Button size="sm" disabled={quadras.length === 0} onClick={() => setAberto(true)}>
          <Plus aria-hidden />
          Bloquear quadra
        </Button>
      </div>

      {bloqueios.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Nenhuma quadra bloqueada ainda.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quadra</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead className="hidden sm:table-cell">Motivo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bloqueios.map((bloqueio) => (
              <TableRow key={bloqueio.id}>
                <TableCell className="font-medium">{bloqueio.quadra.nome}</TableCell>
                <TableCell className="whitespace-nowrap">{formatarDataCurta(bloqueio.inicio)}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatarHora(bloqueio.inicio)}–{formatarHora(bloqueio.fim)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {bloqueio.motivo ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <ConfirmarBotao
                    size="sm"
                    variant="destructive"
                    actionVariant="destructive"
                    label="Remover"
                    titulo="Remover esse bloqueio?"
                    descricao="A quadra volta a aparecer normalmente na agenda nesse horário."
                    textoConfirmar="Remover"
                    textoConfirmando="Removendo…"
                    onConfirmar={() => remover(bloqueio.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <BloqueioTorneioFormDialog
        aberto={aberto}
        onOpenChange={setAberto}
        torneioId={torneioId}
        quadras={quadras}
        onSalvo={() => router.refresh()}
      />
    </section>
  );
}
