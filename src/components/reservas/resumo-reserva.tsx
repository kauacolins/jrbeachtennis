"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatarDataLonga,
  formatarHora,
  formatarPreco,
  formatarTelefone,
} from "@/lib/format";
import { criarReservaPorModalidade } from "@/features/reservas/actions/criar-reserva-modalidade";
import { PagamentoPix } from "@/components/reservas/pagamento-pix";
import { useSession } from "@/lib/auth-client";

const CONTATO_STORAGE_KEY = "arena-jr:contato-reserva";

function lerContatoSalvo() {
  try {
    const bruto = localStorage.getItem(CONTATO_STORAGE_KEY);
    if (!bruto) return null;
    return JSON.parse(bruto) as { nome: string; telefone: string };
  } catch {
    return null;
  }
}

function salvarContato(nome: string, telefone: string) {
  try {
    localStorage.setItem(
      CONTATO_STORAGE_KEY,
      JSON.stringify({ nome, telefone })
    );
  } catch {
    // armazenamento indisponível (modo privado, etc.) — segue sem lembrar
  }
}

export interface ReservaConfirmada {
  reservaId: string;
  inicio: string;
  fim: string;
  valorCentavos: number;
  logado: boolean;
}

// Estado intermediário: reserva já existe (PENDENTE_PAGAMENTO) segurando o
// horário, falta o Pix cair — ver criarReserva.
interface ReservaPendentePagamento extends ReservaConfirmada {
  expiraEm: string;
}

export function ResumoReserva({
  aberto,
  onAbertoChange,
  modalidadeId,
  modalidadeNome,
  inicioISO,
  fimISO,
  valorCentavos,
  duracaoHoras,
  onConfirmado,
  onConflito,
}: {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  modalidadeId: string;
  modalidadeNome: string;
  inicioISO: string;
  fimISO: string;
  valorCentavos: number;
  duracaoHoras: number;
  onConfirmado: (reserva: ReservaConfirmada) => void;
  onConflito: () => void;
}) {
  const session = useSession();
  const logado = Boolean(session.data?.user);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();
  // Reserva já criada (PENDENTE_PAGAMENTO) e aguardando o Pix — enquanto
  // isso não existir, mostra o formulário de contato (passo 1).
  const [reservaPendente, setReservaPendente] = useState<ReservaPendentePagamento | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const usuario = session.data?.user as
      | { name?: string; telefone?: string | null }
      | undefined;
    if (usuario?.name) {
      setNome(usuario.name);
      setTelefone(usuario.telefone ?? "");
    } else {
      const salvo = lerContatoSalvo();
      if (salvo) {
        setNome(salvo.nome);
        setTelefone(salvo.telefone);
      }
    }
    setErro(null);
    setReservaPendente(null);
  }, [aberto, session.data]);

  // Logado e com telefone na conta: a gente já tem tudo, não precisa
  // perguntar de novo — só confirma. Logado sem telefone (ex.: entrou só
  // com Google): pede só o telefone. Convidado: pede os dois, como antes.
  const precisaFormulario = !logado || !telefone;
  const precisaNome = !logado;

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    startTransition(async () => {
      const resultado = await criarReservaPorModalidade({
        modalidadeId,
        inicioISO,
        duracaoHoras,
        nomeContato: nome,
        telefoneContato: telefone,
      });

      if (!resultado.ok) {
        setErro(resultado.erro);
        if (resultado.erro.includes("acabou de ser reservado")) {
          onConflito();
        }
        return;
      }

      salvarContato(nome, telefone);

      if (resultado.precisaPagamento && resultado.expiraEm) {
        setReservaPendente({ ...resultado, expiraEm: resultado.expiraEm });
        return;
      }
      onConfirmado(resultado);
    });
  }

  function pagamentoExpirado() {
    setReservaPendente(null);
    setErro("O prazo pra pagar o Pix expirou e o horário foi liberado. Escolha um horário de novo.");
    onConflito();
  }

  return (
    <Sheet open={aberto} onOpenChange={onAbertoChange}>
      <SheetContent side="bottom">
        <div className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>
              {reservaPendente ? "Pagar com Pix" : "Confirmar reserva"}
            </SheetTitle>
            <SheetDescription>{modalidadeNome}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-1 px-4 text-sm">
            <p className="capitalize">{formatarDataLonga(inicioISO)}</p>
            <p className="text-muted-foreground">
              {formatarHora(inicioISO)} às {formatarHora(fimISO)}
            </p>
            <p className="font-medium">{formatarPreco(valorCentavos)}</p>
            {!reservaPendente && (
              <p className="text-xs text-muted-foreground">
                Cancelamento gratuito até 24 h antes do horário.
              </p>
            )}
          </div>

          {reservaPendente ? (
            <>
              <Separator />
              <PagamentoPix
                reservaId={reservaPendente.reservaId}
                expiraEmISO={reservaPendente.expiraEm}
                onConfirmado={() => onConfirmado(reservaPendente)}
                onExpirado={pagamentoExpirado}
              />
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {precisaFormulario && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3 px-4">
                    {precisaNome && (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="nomeContato">Nome</Label>
                        <Input
                          id="nomeContato"
                          name="nomeContato"
                          autoComplete="name"
                          required
                          minLength={2}
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="telefoneContato">Telefone</Label>
                      <Input
                        id="telefoneContato"
                        name="telefoneContato"
                        type="tel"
                        autoComplete="tel"
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
                </>
              )}

              {erro && (
                <div className="px-4">
                  <Alert variant="destructive">
                    <AlertCircle aria-hidden />
                    <AlertDescription aria-live="polite">{erro}</AlertDescription>
                  </Alert>
                </div>
              )}

              <SheetFooter>
                <Button type="submit" disabled={enviando} className="h-11">
                  {enviando ? "Confirmando…" : "Confirmar reserva"}
                </Button>
              </SheetFooter>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
