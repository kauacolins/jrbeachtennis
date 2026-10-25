import Link from "next/link";
import Image from "next/image";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HandCoins,
  ImageIcon,
  Lock,
  Pencil,
  Star,
  Ticket,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarDataCurta, formatarHora, formatarPreco } from "@/lib/format";
import { rotuloStatusTorneio, variantePorStatusTorneio } from "@/lib/torneio";
import { cn } from "@/lib/utils";
import type { TorneioDetalhe } from "@/features/torneios/actions/obter-torneio";
import type { InscricaoAdmin } from "@/features/torneios/actions/listar-inscritos";

type Categoria = TorneioDetalhe["categorias"][number];

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
    <div className={cn("rounded-xl border p-3", destaque ? "border-warning/50 bg-warning/10" : "bg-accent")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold tabular-nums">{valor}</p>
    </div>
  );
}

function vagasCategoria(categoria: Categoria) {
  const inscritos = categoria._count.inscricoes;
  const restantes = categoria.vagas !== null ? categoria.vagas - inscritos : null;
  return {
    inscritos,
    texto: categoria.vagas !== null ? `${inscritos}/${categoria.vagas}` : String(inscritos),
    cheia: restantes !== null && restantes <= 0,
    poucasVagas: restantes !== null && restantes > 0 && restantes <= 3,
    percentual: categoria.vagas ? Math.min(100, Math.round((inscritos / categoria.vagas) * 100)) : null,
  };
}

function atletas(categoria: Categoria) {
  const n =
    categoria.minAtletas === categoria.maxAtletas
      ? String(categoria.minAtletas)
      : `${categoria.minAtletas}–${categoria.maxAtletas}`;
  return `${n} ${categoria.maxAtletas === 1 ? "atleta" : "atletas"}`;
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-background p-3 sm:p-4">
      <h2 className="font-heading text-lg font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

// Visão geral do torneio (/gerenciamento/torneios/[id]): painel de
// organização do campeonato — dados, números e categorias, tudo só pra
// leitura. Edição de verdade (dados, categorias, quadras bloqueadas) fica em
// /edicao; a lista completa de inscritos por categoria fica em /inscritos.
//
// Mobile: título com a linha inteira (os botões saem do cabeçalho e vão pra
// uma barra fixa no rodapé, na zona do polegar), banner pequeno ao lado dos
// dados empilhados um por linha, e as tabelas viram listas de toque — cada
// categoria leva direto aos inscritos dela.
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
  const hrefInscritos = `/gerenciamento/torneios/${torneio.id}/inscritos`;
  const hrefEdicao = `/gerenciamento/torneios/${torneio.id}/edicao`;

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-0">
      <div className="flex flex-col gap-1">
        <Link
          href="/gerenciamento/torneios"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Torneios
        </Link>
        <div className="flex items-start gap-2">
          <h1 className="flex-1 font-heading text-xl leading-tight font-bold sm:text-2xl">{torneio.nome}</h1>
          <div className="hidden shrink-0 gap-2 md:flex">
            <Button variant="outline" size="lg" nativeButton={false} render={<Link href={hrefInscritos} />}>
              <Users aria-hidden />
              Inscritos
            </Button>
            <Button size="lg" nativeButton={false} render={<Link href={hrefEdicao} />}>
              <Pencil aria-hidden />
              Editar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4">
        <div className="relative aspect-[4/5] w-24 shrink-0 self-start overflow-hidden rounded-xl bg-muted sm:w-32">
          {torneio.bannerUrl ? (
            <Image src={torneio.bannerUrl} alt={torneio.nome} fill sizes="128px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/60">
              <ImageIcon className="size-6" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={variantePorStatusTorneio(torneio.status)}>{rotuloStatusTorneio(torneio.status)}</Badge>
            {torneio.destaqueHome && (
              <span className="inline-flex items-center gap-1 text-xs text-foreground">
                <Star className="size-3.5 fill-warning text-warning" aria-hidden />
                Destaque na home
              </span>
            )}
          </div>
          <p className="flex items-start gap-1.5">
            <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="sr-only">Período: </span>
              {formatarDataCurta(torneio.dataInicio)} – {formatarDataCurta(torneio.dataFim)}
            </span>
          </p>
          <p className="flex items-start gap-1.5">
            <Ticket className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="tabular-nums">
              Inscrições {formatarDataCurta(torneio.inscricoesAbrem)} {formatarHora(torneio.inscricoesAbrem)}
              <span className="whitespace-nowrap">
                {" "}
                – {formatarDataCurta(torneio.inscricoesFecham)} {formatarHora(torneio.inscricoesFecham)}
              </span>
            </span>
          </p>
          <Link
            href={`/torneios/${torneio.slug}`}
            target="_blank"
            className="inline-flex min-h-8 min-w-0 items-center gap-1.5 hover:text-foreground hover:underline"
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            <span className="truncate">Ver página pública</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard label="Categorias" valor={torneio.categorias.length} />
        <StatCard label="Inscrições" valor={inscricoes.length} />
        <StatCard label="Aguardando pagamento" valor={pendentes} destaque={pendentes > 0} />
        <StatCard label="Confirmado" valor={formatarPreco(valorConfirmado)} />
      </div>

      <Secao titulo="Categorias">
        {torneio.categorias.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma categoria cadastrada ainda.{" "}
            <Link href={hrefEdicao} className="underline">
              Cadastrar na edição
            </Link>
            .
          </p>
        ) : (
          <>
            {/* Celular: cada categoria é um item de toque que abre os inscritos dela. */}
            <ul className="flex flex-col gap-2 sm:hidden">
              {torneio.categorias.map((categoria) => {
                const vagas = vagasCategoria(categoria);
                return (
                  <li key={categoria.id}>
                    <Link
                      href={`${hrefInscritos}#categoria-${categoria.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 outline-none transition-colors hover:bg-muted focus-visible:bg-muted active:bg-muted"
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-medium">{categoria.nome}</span>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">
                            {formatarPreco(categoria.valorCentavos)}
                          </span>
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {categoria.modalidade.nome} · {atletas(categoria)}
                        </span>
                        <span className="flex items-center gap-2">
                          {vagas.percentual !== null && (
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                              <span
                                className={cn(
                                  "block h-full rounded-full",
                                  vagas.cheia ? "bg-destructive" : vagas.poucasVagas ? "bg-warning" : "bg-primary"
                                )}
                                style={{ width: `${vagas.percentual}%` }}
                              />
                            </span>
                          )}
                          <span
                            className={cn(
                              "shrink-0 text-xs tabular-nums",
                              vagas.cheia
                                ? "font-medium text-destructive"
                                : vagas.poucasVagas
                                  ? "font-medium text-warning"
                                  : "text-muted-foreground"
                            )}
                          >
                            {vagas.texto} {categoria.vagas !== null ? "vagas" : "inscritos"}
                            {vagas.cheia && " · cheia"}
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Table className="hidden sm:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Atletas</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Vagas</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {torneio.categorias.map((categoria) => {
                  const vagas = vagasCategoria(categoria);
                  return (
                    <TableRow key={categoria.id}>
                      <TableCell className="font-medium">{categoria.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{categoria.modalidade.nome}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
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
                          vagas.cheia
                            ? "font-medium text-destructive"
                            : vagas.poucasVagas
                              ? "font-medium text-warning"
                              : "text-muted-foreground"
                        )}
                      >
                        {vagas.texto}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          nativeButton={false}
                          render={<Link href={`${hrefInscritos}#categoria-${categoria.id}`} />}
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
          </>
        )}
      </Secao>

      <Secao titulo="Quadras bloqueadas">
        {torneio.bloqueios.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma quadra bloqueada ainda.
          </p>
        ) : (
          <>
            <ul className="flex flex-col divide-y rounded-lg border sm:hidden">
              {torneio.bloqueios.map((bloqueio) => (
                <li key={bloqueio.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{bloqueio.quadra.nome}</span>
                    {bloqueio.motivo && (
                      <span className="truncate text-xs text-muted-foreground">{bloqueio.motivo}</span>
                    )}
                  </span>
                  <span className="flex shrink-0 flex-col items-end text-xs tabular-nums">
                    <span className="font-medium">{formatarDataCurta(bloqueio.inicio)}</span>
                    <span className="text-muted-foreground">
                      {formatarHora(bloqueio.inicio)}–{formatarHora(bloqueio.fim)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <Table className="hidden sm:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Quadra</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Motivo</TableHead>
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
                    <TableCell className="text-muted-foreground">{bloqueio.motivo ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Secao>

      {(torneio.doacao || torneio.descricao) && (
        <Secao titulo="Sobre">
          {torneio.doacao && (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <HandCoins className="mt-0.5 size-4 shrink-0" aria-hidden />
              Contribuição: {torneio.doacao}
            </p>
          )}
          {torneio.descricao && <p className="text-sm break-words whitespace-pre-wrap">{torneio.descricao}</p>}
        </Secao>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <Button variant="outline" className="h-11" nativeButton={false} render={<Link href={hrefInscritos} />}>
          <Users aria-hidden />
          Inscritos
          {pendentes > 0 && (
            <span className="rounded-full bg-warning px-1.5 text-xs text-warning-foreground tabular-nums">
              {pendentes}
            </span>
          )}
        </Button>
        <Button className="h-11" nativeButton={false} render={<Link href={hrefEdicao} />}>
          <Pencil aria-hidden />
          Editar
        </Button>
      </div>
    </div>
  );
}
