import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarClock, ExternalLink, HandCoins, Pencil, Star, Ticket, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarDataCurta, formatarHora, formatarPreco } from "@/lib/format";
import { rotuloStatusTorneio, variantePorStatusTorneio } from "@/lib/torneio";
import { cn } from "@/lib/utils";
import type { TorneioDetalhe } from "@/features/torneios/actions/obter-torneio";
import type { InscricaoAdmin } from "@/features/torneios/actions/listar-inscritos";

function StatCard({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string | number;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-heading text-lg font-semibold tabular-nums", destaque && "text-warning")}>
        {valor}
      </p>
    </div>
  );
}

// Visão geral do torneio (/gerenciamento/torneios/[id]): painel de
// organização do campeonato — dados, números e categorias, tudo só pra
// leitura. Edição de verdade (dados, categorias, quadras bloqueadas) fica em
// /edicao; a lista completa de inscritos por categoria fica em /inscritos.
export function TorneioVisaoGeral({
  torneio,
  inscricoes,
}: {
  torneio: TorneioDetalhe;
  inscricoes: InscricaoAdmin[];
}) {
  const pendentes = inscricoes.filter((i) => i.status === "PENDENTE").length;
  const valorConfirmado = inscricoes
    .filter((i) => i.status === "CONFIRMADA")
    .reduce((soma, i) => soma + i.valorCentavos, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" render={<Link href="/gerenciamento/torneios" />}>
          <ArrowLeft aria-hidden />
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="flex-1 font-heading text-xl font-bold">{torneio.nome}</h1>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/gerenciamento/torneios/${torneio.id}/inscritos`} />}
        >
          <Users aria-hidden />
          Inscritos
        </Button>
        <Button size="sm" render={<Link href={`/gerenciamento/torneios/${torneio.id}/edicao`} />}>
          <Pencil aria-hidden />
          Editar
        </Button>
      </div>

      {torneio.bannerUrl && (
        <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl bg-muted">
          <Image src={torneio.bannerUrl} alt={torneio.nome} fill sizes="700px" className="object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Badge variant={variantePorStatusTorneio(torneio.status)}>{rotuloStatusTorneio(torneio.status)}</Badge>
        {torneio.destaqueHome && (
          <span className="inline-flex items-center gap-1 text-warning">
            <Star className="size-3.5 fill-warning" aria-hidden />
            Destaque na home
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-4" aria-hidden />
          {formatarDataCurta(torneio.dataInicio)} – {formatarDataCurta(torneio.dataFim)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Ticket className="size-4" aria-hidden />
          Inscrições {formatarDataCurta(torneio.inscricoesAbrem)} {formatarHora(torneio.inscricoesAbrem)} –{" "}
          {formatarDataCurta(torneio.inscricoesFecham)} {formatarHora(torneio.inscricoesFecham)}
        </span>
        <Link
          href={`/torneios/${torneio.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
        >
          /torneios/{torneio.slug}
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Categorias" valor={torneio.categorias.length} />
        <StatCard label="Inscrições" valor={inscricoes.length} />
        <StatCard label="Aguardando pagamento" valor={pendentes} destaque={pendentes > 0} />
        <StatCard label="Confirmado" valor={formatarPreco(valorConfirmado)} />
      </div>

      <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <h2 className="font-heading text-lg font-bold">Categorias</h2>

        {torneio.categorias.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma categoria cadastrada ainda.{" "}
            <Link href={`/gerenciamento/torneios/${torneio.id}/edicao`} className="underline">
              Cadastrar na edição
            </Link>
            .
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="hidden sm:table-cell">Modalidade</TableHead>
                <TableHead className="hidden sm:table-cell">Atletas</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Vagas</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {torneio.categorias.map((categoria) => {
                const inscritos = categoria._count.inscricoes;
                const restantes = categoria.vagas !== null ? categoria.vagas - inscritos : null;
                const cheia = restantes !== null && restantes <= 0;
                const poucasVagas = restantes !== null && restantes > 0 && restantes <= 3;
                return (
                  <TableRow key={categoria.id}>
                    <TableCell className="font-medium">{categoria.nome}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {categoria.modalidade.nome}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {categoria.minAtletas === categoria.maxAtletas
                        ? categoria.minAtletas
                        : `${categoria.minAtletas}–${categoria.maxAtletas}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarPreco(categoria.valorCentavos)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        cheia
                          ? "font-medium text-destructive"
                          : poucasVagas
                            ? "font-medium text-warning"
                            : "text-muted-foreground"
                      )}
                    >
                      {categoria.vagas !== null ? `${inscritos}/${categoria.vagas}` : inscritos}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={
                          <Link
                            href={`/gerenciamento/torneios/${torneio.id}/inscritos#categoria-${categoria.id}`}
                          />
                        }
                      >
                        <Users aria-hidden />
                        <span className="sr-only">Ver inscritos de {categoria.nome}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <h2 className="font-heading text-lg font-bold">Quadras bloqueadas</h2>

        {torneio.bloqueios.length === 0 ? (
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {torneio.bloqueios.map((bloqueio) => (
                <TableRow key={bloqueio.id}>
                  <TableCell className="font-medium">{bloqueio.quadra.nome}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatarDataCurta(bloqueio.inicio)}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatarHora(bloqueio.inicio)}–{formatarHora(bloqueio.fim)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {bloqueio.motivo ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {(torneio.doacao || torneio.descricao) && (
        <section className="flex flex-col gap-2 rounded-xl border bg-background p-4">
          <h2 className="font-heading text-lg font-bold">Sobre</h2>
          {torneio.doacao && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <HandCoins className="size-4" aria-hidden />
              Contribuição: {torneio.doacao}
            </p>
          )}
          {torneio.descricao && <p className="text-sm whitespace-pre-wrap">{torneio.descricao}</p>}
        </section>
      )}
    </div>
  );
}
