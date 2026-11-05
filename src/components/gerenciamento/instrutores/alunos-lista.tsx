"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, Clock, GraduationCap, Pencil, Phone, Plus, RefreshCw, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmarBotao } from "@/components/gerenciamento/confirmar-botao";
import { BuscarCliente } from "@/components/gerenciamento/balcao/buscar-cliente";
import { SeletorMetodo } from "@/components/gerenciamento/balcao/seletor-metodo";
import { CabecalhoLista } from "@/components/gerenciamento/cabecalho-lista";
import { CampoBusca, SemResultadoBusca } from "@/components/gerenciamento/campo-busca";
import { MensagemClienteMenu } from "@/components/gerenciamento/clientes/mensagem-cliente-menu";
import { modelosMensagemAluno } from "@/components/gerenciamento/instrutores/mensagens-aluno";
import type { PixArena } from "@/components/gerenciamento/reserva-detalhe-painel";
import { filtrarPorBusca } from "@/lib/busca";
import { cn } from "@/lib/utils";
import { contagem, formatarDataCurta, formatarPreco, formatarTelefone } from "@/lib/format";
import {
  desativarAluno,
  editarAluno,
  matricularAluno,
  registrarPagamento,
  renovarMensalidade,
} from "@/features/instrutores/actions/alunos";
import type { AlunoLinha, PlanoAulaLinha } from "@/features/instrutores/actions/listar-instrutores";
import type { MetodoPagamento } from "@/app/generated/prisma/enums";
import type { FiltroAluno } from "./filtros-aluno";

const ABAS: { valor: FiltroAluno; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "em_dia", label: "Em dia" },
  { valor: "vencendo", label: "Vencendo" },
  { valor: "em_aberto", label: "Em aberto" },
  { valor: "vencidos", label: "Vencidos" },
  { valor: "inativos", label: "Saíram" },
];

const VAZIO: Record<FiltroAluno, string> = {
  todos: "Nenhum aluno matriculado ainda.",
  em_dia: "Nenhum aluno em dia.",
  vencendo: "Nenhuma mensalidade vence nos próximos 7 dias.",
  em_aberto: "Nenhuma mensalidade em aberto.",
  vencidos: "Ninguém com mensalidade vencida.",
  inativos: "Nenhum aluno saiu.",
};

// Bolinha + badge do card, mesma lógica de cores do Mensalistas: verde em
// dia, laranja vencendo ou em aberto (tem cobrança a fazer), vermelho vencido.
function situacaoCard(aluno: AlunoLinha) {
  if (!aluno.ativo) return { label: "Saiu", ponto: "bg-muted-foreground", badge: "bg-muted text-muted-foreground" };
  switch (aluno.situacao) {
    case "EM_ABERTO":
      return { label: "Em aberto", ponto: "bg-warning", badge: "bg-warning text-warning-foreground" };
    case "VENCENDO":
      return { label: "Vence em breve", ponto: "bg-warning", badge: "bg-warning/15 text-foreground" };
    case "EM_DIA":
      return { label: "Em dia", ponto: "bg-primary", badge: "bg-accent text-accent-foreground" };
    default:
      return { label: "Vencida", ponto: "bg-destructive", badge: "bg-destructive/10 text-destructive" };
  }
}

type Modo = "matricular" | "renovar" | "receber" | "editar";

// Alunos do instrutor (docs/INSTRUTORES.md): mesma estrutura da tela de
// Mensalistas. A diferença é que a mensalidade pode ficar em aberto —
// "Lançar em aberto" cria o mês e o aluno paga depois ("Receber").
export function AlunosLista({
  instrutor,
  alunos: todos,
  planos,
  filtro,
  pix,
}: {
  instrutor: { id: string; nome: string; ativo: boolean };
  alunos: AlunoLinha[];
  planos: PlanoAulaLinha[];
  filtro: FiltroAluno;
  pix: PixArena | null;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo | null>(null);
  const [aluno, setAluno] = useState<AlunoLinha | null>(null);
  const [cliente, setCliente] = useState<{ id: string; nome: string } | null>(null);
  const [planoId, setPlanoId] = useState<string>("");
  const [horario, setHorario] = useState("");
  const [observacao, setObservacao] = useState("");
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null);
  const [busca, setBusca] = useState("");
  const [pendente, startTransition] = useTransition();

  const ativos = todos.filter((a) => a.ativo);
  const porFiltro: Record<FiltroAluno, AlunoLinha[]> = {
    todos: ativos,
    em_dia: ativos.filter((a) => a.situacao === "EM_DIA"),
    vencendo: ativos.filter((a) => a.situacao === "VENCENDO"),
    em_aberto: ativos.filter((a) => a.situacao === "EM_ABERTO"),
    vencidos: ativos.filter((a) => a.situacao === "VENCIDO"),
    inativos: todos.filter((a) => !a.ativo),
  };
  const lista = porFiltro[filtro];
  const visiveis = filtrarPorBusca(lista, busca, (a) => [a.cliente.nome, a.cliente.telefone, a.planoAula.nome]);
  const planosAtivos = planos.filter((p) => p.ativo);
  const planoEscolhido = planos.find((p) => p.id === planoId) ?? null;

  function abrir(novoModo: Modo, alvo: AlunoLinha | null) {
    setModo(novoModo);
    setAluno(alvo);
    setMetodo(null);
    setCliente(alvo ? { id: alvo.cliente.id, nome: alvo.cliente.nome } : null);
    const planoInicial =
      alvo && (novoModo === "editar" || planosAtivos.some((p) => p.id === alvo.planoAula.id))
        ? alvo.planoAula.id
        : (planosAtivos[0]?.id ?? "");
    setPlanoId(planoInicial);
    setHorario(alvo?.horario ?? "");
    setObservacao(alvo?.observacao ?? "");
  }

  function fechar() {
    setModo(null);
  }

  function executar(acao: () => Promise<{ ok: true } | { ok: false; erro: string }>, sucesso: string) {
    startTransition(async () => {
      const resultado = await acao();
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(sucesso);
      fechar();
      router.refresh();
    });
  }

  function lancar(comMetodo: MetodoPagamento | null) {
    if (modo === "matricular" && cliente) {
      executar(
        async () => {
          const r = await matricularAluno({
            instrutorId: instrutor.id,
            clienteId: cliente.id,
            planoAulaId: planoId,
            horario,
            observacao,
            metodo: comMetodo,
          });
          return r.ok ? { ok: true } : r;
        },
        comMetodo ? `${cliente.nome} matriculado(a), mês pago.` : `${cliente.nome} matriculado(a), mês em aberto.`
      );
    } else if (modo === "renovar" && aluno) {
      executar(
        async () => {
          const r = await renovarMensalidade({ alunoId: aluno.id, metodo: comMetodo });
          if (r.ok) toast.message(`Vale até ${formatarDataCurta(r.fim)}.`);
          return r.ok ? { ok: true } : r;
        },
        comMetodo ? `Mensalidade de ${aluno.cliente.nome} paga.` : `Mensalidade de ${aluno.cliente.nome} lançada em aberto.`
      );
    }
  }

  function receber() {
    if (!aluno || !metodo) return;
    executar(async () => {
      const r = await registrarPagamento({ alunoId: aluno.id, metodo });
      return r.ok ? { ok: true } : r;
    }, `Pagamento de ${aluno.cliente.nome} registrado.`);
  }

  function salvarEdicao() {
    if (!aluno) return;
    executar(
      () => editarAluno({ alunoId: aluno.id, planoAulaId: planoId, horario, observacao }),
      "Aluno atualizado."
    );
  }

  function desativar(alvo: AlunoLinha) {
    executar(() => desativarAluno(alvo.id), `${alvo.cliente.nome} saiu da turma.`);
  }

  const precoDialog =
    modo === "receber" ? (aluno?.emAbertoCentavos ?? 0) : (planoEscolhido?.precoCentavos ?? aluno?.planoAula.precoCentavos ?? 0);

  return (
    <section className="flex flex-col gap-4" aria-label="Alunos">
      <CabecalhoLista
        secao
        titulo="Alunos"
        contagem={ativos.length > 0 ? contagem(ativos.length, "aluno ativo", "alunos ativos") : undefined}
        acao={
          instrutor.ativo && (
            <Button
              size="lg"
              className="h-11 px-5 text-base"
              disabled={planosAtivos.length === 0}
              title={planosAtivos.length === 0 ? "Cadastre um plano antes" : undefined}
              onClick={() => abrir("matricular", null)}
            >
              <Plus className="size-5" aria-hidden />
              Matricular aluno
            </Button>
          )
        }
      />

      <nav aria-label="Situação da mensalidade" className="flex gap-1 overflow-x-auto">
        {ABAS.map((aba) => (
          <Link
            key={aba.valor}
            href={`/gerenciamento/instrutores/${instrutor.id}?filtro=${aba.valor}`}
            aria-current={aba.valor === filtro ? "page" : undefined}
            scroll={false}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              aba.valor === filtro
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {aba.label}
            <span
              className={cn(
                "min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums",
                aba.valor === filtro ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              )}
            >
              {porFiltro[aba.valor].length}
            </span>
          </Link>
        ))}
      </nav>

      {lista.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <GraduationCap className="size-6" aria-hidden />
          {VAZIO[filtro]}
        </div>
      ) : (
        <>
          <CampoBusca
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome, telefone ou plano"
            ariaLabel="Buscar aluno"
          />
          {visiveis.length === 0 ? (
            <SemResultadoBusca busca={busca} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visiveis.map((a) => {
                const situacao = situacaoCard(a);
                const validoAte = a.validoAte ? new Date(a.validoAte) : null;
                const modelos = modelosMensagemAluno({
                  nome: a.cliente.nome,
                  instrutor: instrutor.nome,
                  plano: a.planoAula.nome,
                  precoCentavos: a.planoAula.precoCentavos,
                  horario: a.horario,
                  situacao: a.situacao,
                  ativo: a.ativo,
                  validoAte,
                  emAbertoCentavos: a.emAbertoCentavos,
                  mesesEmAberto: a.mesesEmAberto,
                  ultimoPagamento: a.ultimoPagamento ? new Date(a.ultimoPagamento) : null,
                  ultimoMetodo: a.ultimoMetodo,
                  matriculadoEm: new Date(a.createdAt),
                  pix,
                });
                return (
                  <li key={a.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={cn("size-2.5 shrink-0 rounded-full", situacao.ponto)} aria-hidden />
                          <span className="truncate font-semibold">{a.cliente.nome}</span>
                        </span>
                        <span className="flex items-center gap-1.5 pl-[18px] text-xs text-muted-foreground tabular-nums">
                          <Phone className="size-3" aria-hidden />
                          {a.cliente.telefone ? formatarTelefone(a.cliente.telefone) : "Sem telefone"}
                        </span>
                      </div>
                      <Badge className={cn("shrink-0 rounded-full text-[11px]", situacao.badge)}>{situacao.label}</Badge>
                    </div>

                    <div className="flex flex-col gap-0.5 text-sm">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate">{a.planoAula.nome}</span>
                        <span className="text-muted-foreground tabular-nums">{formatarPreco(a.planoAula.precoCentavos)}</span>
                      </span>
                      {a.horario && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3" aria-hidden />
                          {a.horario}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {!validoAte
                          ? "Sem mensalidade"
                          : a.vigente
                            ? `Vale até ${formatarDataCurta(validoAte)}`
                            : `Venceu ${formatarDataCurta(validoAte)}`}
                      </span>
                      {a.emAbertoCentavos > 0 ? (
                        <span className="font-heading text-lg font-bold text-warning tabular-nums">
                          {formatarPreco(a.emAbertoCentavos)}
                        </span>
                      ) : (
                        a.ativo &&
                        a.vigente &&
                        a.diasRestantes !== null && (
                          <span className="font-heading text-lg font-bold tabular-nums">
                            {contagem(a.diasRestantes, "dia", "dias")}
                          </span>
                        )
                      )}
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      {a.emAbertoCentavos > 0 ? (
                        <Button variant="secondary" size="lg" className="h-10" onClick={() => abrir("receber", a)}>
                          <Banknote aria-hidden />
                          Receber
                        </Button>
                      ) : a.ativo ? (
                        <Button
                          variant="secondary"
                          size="lg"
                          className="h-10"
                          disabled={!instrutor.ativo}
                          onClick={() => abrir("renovar", a)}
                        >
                          <RefreshCw aria-hidden />
                          Renovar
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="lg"
                          className="h-10"
                          disabled={!instrutor.ativo || planosAtivos.length === 0}
                          onClick={() => abrir("matricular", a)}
                        >
                          <UserCheck aria-hidden />
                          Voltou
                        </Button>
                      )}
                      <MensagemClienteMenu
                        nome={a.cliente.nome}
                        telefone={a.cliente.telefone}
                        modelos={modelos}
                        className="h-10"
                      />
                    </div>

                    {a.ativo && (
                      <div className="-mt-1 flex flex-wrap items-center justify-center gap-1">
                        {a.emAbertoCentavos > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground"
                            disabled={!instrutor.ativo}
                            onClick={() => abrir("renovar", a)}
                          >
                            Renovar
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => abrir("editar", a)}>
                          <Pencil aria-hidden />
                          Editar
                        </Button>
                        <ConfirmarBotao
                          size="sm"
                          variant="ghost"
                          actionVariant="destructive"
                          className="text-muted-foreground"
                          label="Saiu da turma"
                          titulo={`${a.cliente.nome} saiu da turma?`}
                          descricao="Cancela os meses que ainda não começaram e o mês atual se estiver em aberto. O que já foi pago e dívidas de meses passados continuam no histórico."
                          textoConfirmar="Confirmar saída"
                          textoConfirmando="Salvando…"
                          disabled={pendente}
                          onConfirmar={() => desativar(a)}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Dialog open={modo !== null} onOpenChange={(aberto) => !aberto && fechar()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modo === "matricular"
                ? cliente
                  ? `Matricular ${cliente.nome}`
                  : "Matricular aluno"
                : modo === "renovar"
                  ? `Renovar ${aluno?.cliente.nome ?? ""}`
                  : modo === "receber"
                    ? `Receber de ${aluno?.cliente.nome ?? ""}`
                    : `Editar ${aluno?.cliente.nome ?? ""}`}
            </DialogTitle>
            <DialogDescription>
              {modo === "matricular" && !cliente
                ? "Busque o cliente ou faça o cadastro rápido."
                : modo === "renovar"
                  ? "Se a mensalidade ainda vale, o mês novo começa quando ela vencer."
                  : modo === "receber"
                    ? aluno && aluno.mesesEmAberto > 1
                      ? `${aluno.mesesEmAberto} mensalidades em aberto, recebidas juntas.`
                      : "Mensalidade em aberto."
                    : modo === "editar"
                      ? "Plano novo vale a partir da próxima mensalidade."
                      : `Aulas com ${instrutor.nome}.`}
            </DialogDescription>
          </DialogHeader>

          {modo === "matricular" && !cliente ? (
            <BuscarCliente acaoLabel="Escolher" onSelecionar={(c) => setCliente({ id: c.id, nome: c.nome })} />
          ) : (
            <div className="flex flex-col gap-3">
              {(modo === "matricular" || modo === "editar") && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="aluno-plano">Plano</Label>
                    <Select value={planoId} onValueChange={(v) => setPlanoId(String(v))}>
                      <SelectTrigger id="aluno-plano" className="h-9! w-full">
                        <SelectValue>
                          {(valor: string) => {
                            const p = planos.find((x) => x.id === valor);
                            return p ? `${p.nome} · ${formatarPreco(p.precoCentavos)}` : "Escolha o plano";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {planos
                          .filter((p) => p.ativo || p.id === aluno?.planoAula.id)
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome} · {formatarPreco(p.precoCentavos)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="aluno-horario">Horário (opcional)</Label>
                    <Input
                      id="aluno-horario"
                      placeholder="ter e qui, 19h"
                      maxLength={80}
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="aluno-obs">Observação (opcional)</Label>
                    <Textarea
                      id="aluno-obs"
                      rows={2}
                      maxLength={300}
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                    />
                  </div>
                </>
              )}

              {modo === "editar" ? (
                <DialogFooter>
                  <Button className="h-11 w-full" disabled={!planoId || pendente} onClick={salvarEdicao}>
                    {pendente ? "Salvando…" : "Salvar"}
                  </Button>
                </DialogFooter>
              ) : (
                <>
                  <p className="text-center text-3xl font-semibold tabular-nums">{formatarPreco(precoDialog)}</p>
                  <SeletorMetodo valor={metodo} onChange={setMetodo} />
                  <DialogFooter className="flex-col gap-2 sm:flex-col">
                    {modo === "receber" ? (
                      <Button className="h-11 w-full" disabled={!metodo || pendente} onClick={receber}>
                        {pendente ? "Salvando…" : "Confirmar pagamento"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          className="h-11 w-full"
                          disabled={!metodo || !planoId || pendente}
                          onClick={() => lancar(metodo)}
                        >
                          {pendente ? "Salvando…" : "Confirmar pagamento"}
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 w-full"
                          disabled={!planoId || pendente}
                          onClick={() => lancar(null)}
                        >
                          Lançar em aberto (paga depois)
                        </Button>
                      </>
                    )}
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
