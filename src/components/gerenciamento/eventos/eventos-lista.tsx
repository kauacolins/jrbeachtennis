"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { filtrarPorBusca } from "@/lib/busca";
import { formatarDataCurta, formatarHora } from "@/lib/format";
import { ImagemEvento } from "@/components/gerenciamento/eventos/imagem-evento";
import { EventoFormDialog } from "@/components/gerenciamento/eventos/evento-form-dialog";
import { removerEvento } from "@/features/eventos/actions/remover-evento";
import type { EventoAdmin } from "@/features/eventos/actions/listar-eventos";

// Avisos mostrados no modal de entrada do site (ver docs do módulo de
// eventos). Sem página de detalhe separada no admin — cabe tudo no diálogo.
export function EventosLista({ eventos }: { eventos: EventoAdmin[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<EventoAdmin | null>(null);
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(eventos, busca, (e) => [e.titulo, e.resumo]);

  function abrir(evento: EventoAdmin | null) {
    setEditando(evento);
    setAberto(true);
  }

  async function excluir(eventoId: string) {
    const resultado = await removerEvento(eventoId);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Evento excluído.");
    router.refresh();
  }

  return (
    <section aria-labelledby="eventos-titulo" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 id="eventos-titulo" className="font-heading text-xl font-bold">
          Eventos
        </h1>
        <Button size="sm" onClick={() => abrir(null)}>
          <Plus aria-hidden />
          Novo evento
        </Button>
      </div>

      {eventos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum evento ainda. Cadastre um aviso (aula, manutenção...) pra mostrar no modal de entrada
          do site.
        </p>
      ) : (
        <>
          <CampoBusca
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por título ou resumo"
            ariaLabel="Buscar evento"
          />
          {visiveis.length === 0 ? (
            <SemResultadoBusca busca={busca} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">
                    <span className="sr-only">Imagem</span>
                  </TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead className="hidden sm:table-cell">Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((evento) => (
                  <TableRow key={evento.id}>
                    <TableCell className="py-2">
                      <ImagemEvento
                        imagemUrl={evento.imagemUrl}
                        titulo={evento.titulo}
                        sizes="40px"
                        className="size-10 rounded-md"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{evento.titulo}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {evento.data
                        ? `${formatarDataCurta(evento.data)} · ${formatarHora(evento.data)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {evento.ativo ? (
                        <Badge variant="secondary">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => abrir(evento)}>
                          Editar
                        </Button>
                        <ConfirmarBotao
                          label="Excluir"
                          titulo="Excluir evento?"
                          descricao={`"${evento.titulo}" não vai mais aparecer no site.`}
                          textoConfirmar="Excluir"
                          textoConfirmando="Excluindo…"
                          variant="destructive"
                          actionVariant="destructive"
                          size="sm"
                          onConfirmar={() => excluir(evento.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      <EventoFormDialog
        aberto={aberto}
        onOpenChange={setAberto}
        evento={editando}
        onSalvo={() => router.refresh()}
      />
    </section>
  );
}
