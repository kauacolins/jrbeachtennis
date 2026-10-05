"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GradeHorarios } from "@/components/reservas/grade-horarios";
import { SeletorDuracao } from "@/components/reservas/seletor-duracao";
import { formatarDataExtensaISO } from "@/lib/datas";
import { formatarTelefone } from "@/lib/format";
import { listarHorariosDisponiveis, type Slot } from "@/features/reservas/actions/listar-horarios-disponiveis";
import { criarReservaAdmin } from "@/features/reservas/actions/criar-reserva-admin";
import type { QuadraAdmin } from "@/features/quadras/actions/listar-quadras-admin";
import type { AgendaBloco } from "@/features/gerenciamento/actions/obter-agenda-dia";

function minutosDoLabel(horaLabel: string) {
  const [h, m] = horaLabel.split(":").map(Number);
  return h * 60 + m;
}

// RF14: admin cria uma reserva em nome de um cliente sem conta — quem
// agenda por telefone ou presencial, sem passar pelo fluxo público de
// reserva. Reaproveita a mesma grade de horários e seletor de duração do
// fluxo do cliente (ver BookingWidget), só trocando "qual quadra" por uma
// escolha explícita em vez de ser atribuída automaticamente.
export function NovaReservaDialog({
  aberto,
  onOpenChange,
  quadras,
  dataISO,
  onCriada,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  quadras: QuadraAdmin[];
  dataISO: string;
  onCriada: (quadraId: string, bloco: AgendaBloco) => void;
}) {
  const quadrasAtivas = useMemo(() => quadras.filter((q) => q.ativa), [quadras]);

  const [quadraId, setQuadraId] = useState(quadrasAtivas[0]?.id ?? "");
  const [modalidadeId, setModalidadeId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState<Slot | null>(null);
  const [duracao, setDuracao] = useState(1);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  const quadra = quadrasAtivas.find((q) => q.id === quadraId) ?? null;

  // Reseta o formulário toda vez que o diálogo abre — evita carregar
  // seleção de uma reserva anterior já criada.
  useEffect(() => {
    if (!aberto) return;
    setQuadraId(quadrasAtivas[0]?.id ?? "");
    setSlotSelecionado(null);
    setDuracao(1);
    setNome("");
    setTelefone("");
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  // Troca de quadra: a modalidade selecionada pode não existir mais nela.
  useEffect(() => {
    if (!quadra) {
      setModalidadeId("");
      return;
    }
    setModalidadeId((atual) =>
      quadra.modalidades.some((m) => m.id === atual)
        ? atual
        : (quadra.modalidades[0]?.id ?? "")
    );
  }, [quadra]);

  useEffect(() => {
    if (!aberto || !quadraId) {
      setSlots([]);
      return;
    }
    setCarregandoSlots(true);
    setSlotSelecionado(null);
    listarHorariosDisponiveis(quadraId, dataISO)
      .then(setSlots)
      .finally(() => setCarregandoSlots(false));
  }, [aberto, quadraId, dataISO]);

  const itensQuadra = useMemo(
    () => Object.fromEntries(quadrasAtivas.map((q) => [q.id, q.nome])),
    [quadrasAtivas]
  );
  const itensModalidade = useMemo(
    () =>
      Object.fromEntries((quadra?.modalidades ?? []).map((m) => [m.id, m.nome])),
    [quadra]
  );

  function selecionarSlot(slot: Slot) {
    setSlotSelecionado(slot);
    setDuracao(1);
  }

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (!quadra || !modalidadeId || !slotSelecionado) {
      setErro("Escolha quadra, modalidade e horário.");
      return;
    }

    startTransition(async () => {
      const resultado = await criarReservaAdmin({
        quadraId: quadra.id,
        modalidadeId,
        inicioISO: slotSelecionado.inicio,
        duracaoHoras: duracao,
        nomeContato: nome,
        telefoneContato: telefone,
      });

      if (!resultado.ok) {
        setErro(resultado.erro);
        if (resultado.erro.includes("acabou de ser reservado")) {
          listarHorariosDisponiveis(quadra.id, dataISO).then(setSlots);
        }
        return;
      }

      const inicioMin = minutosDoLabel(slotSelecionado.horaLabel);
      onCriada(quadra.id, {
        tipo: "reserva",
        id: resultado.reservaId,
        inicioMin,
        fimMin: inicioMin + duracao * 60,
        titulo: nome,
        subtitulo: formatarTelefone(telefone),
        status: "CONFIRMADA",
        pago: false,
        valorCentavos: resultado.valorCentavos,
      });

      toast.success("Reserva criada.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Nova reserva</DialogTitle>
            <p className="text-sm text-muted-foreground capitalize">
              {formatarDataExtensaISO(dataISO)}
            </p>
          </DialogHeader>

          {quadrasAtivas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma quadra ativa cadastrada.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nova-reserva-quadra">Quadra</Label>
                  <Select
                    items={itensQuadra}
                    value={quadraId}
                    onValueChange={(value) => value && setQuadraId(value)}
                  >
                    <SelectTrigger id="nova-reserva-quadra" className="h-11! w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quadrasAtivas.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nova-reserva-modalidade">Modalidade</Label>
                  <Select
                    items={itensModalidade}
                    value={modalidadeId}
                    onValueChange={(value) => value && setModalidadeId(value)}
                  >
                    <SelectTrigger id="nova-reserva-modalidade" className="h-11! w-full">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {(quadra?.modalidades ?? []).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Horário
                </p>
                {carregandoSlots ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Carregando…
                  </p>
                ) : quadra ? (
                  <GradeHorarios
                    slots={slots}
                    precoHoraCentavos={quadra.precoHoraCentavos}
                    inicioSelecionado={slotSelecionado?.inicio ?? null}
                    onSelecionar={selecionarSlot}
                  />
                ) : null}
              </div>

              {slotSelecionado && slotSelecionado.duracaoMaximaHoras > 1 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Duração
                  </p>
                  <SeletorDuracao
                    duracaoMaxima={slotSelecionado.duracaoMaximaHoras}
                    valor={duracao}
                    onChange={setDuracao}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nova-reserva-nome">Nome</Label>
                  <Input
                    id="nova-reserva-nome"
                    required
                    minLength={2}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nova-reserva-telefone">Telefone</Label>
                  <Input
                    id="nova-reserva-telefone"
                    type="tel"
                    required
                    minLength={8}
                    value={formatarTelefone(telefone)}
                    onChange={(e) =>
                      setTelefone(e.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                    className="h-11"
                  />
                </div>
              </div>

              {erro && (
                <p className="text-sm text-destructive" aria-live="polite">
                  {erro}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={enviando || !slotSelecionado}
                >
                  {enviando ? "Criando…" : "Criar reserva"}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
