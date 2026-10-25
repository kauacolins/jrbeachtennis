"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { filtrarPorBusca } from "@/lib/busca";
import { contagem, formatarDataCurta, formatarHora } from "@/lib/format";
import { ImagemEvento } from "@/components/gerenciamento/eventos/imagem-evento";
import { removerEvento } from "@/features/eventos/actions/remover-evento";
import type { EventoAdmin } from "@/features/eventos/actions/listar-eventos";

// Avisos mostrados no modal de entrada do site (ver docs do módulo de
// eventos). Cadastro e edição abrem em tela própria (EventoForm);
// `sugestoes` são os atalhos de modelos prontos (SugestoesEvento).
export function EventosLista({ eventos, sugestoes }: { eventos: EventoAdmin[]; sugestoes?: ReactNode }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const visiveis = filtrarPorBusca(eventos, busca, (e) => [e.titulo, e.resumo]);

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
    <section aria-label="Eventos" className="flex flex-col gap-3">
      <CabecalhoLista
        titulo="Eventos"
        contagem={eventos.length > 0 ? contagem(eventos.length, "evento cadastrado", "eventos cadastrados") : undefined}
        acao={
          <Button size="sm" nativeButton={false} render={<Link href="/gerenciamento/eventos/novo" />}>
            <Plus aria-hidden />
            Novo evento
          </Button>
        }
      />

      {sugestoes && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Sugestões de aviso</h2>
          {sugestoes}
        </div>
      )}

      {eventos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum evento ainda. Escolha uma sugestão acima ou cadastre um aviso em branco pra mostrar
          no modal de entrada do site.
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
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/gerenciamento/eventos/${evento.id}`} />}
                        >
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
    </section>
  );
}
