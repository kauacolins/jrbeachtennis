"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeletorData } from "@/components/gerenciamento/seletor-data";
import { salvarTorneio } from "@/features/torneios/actions/salvar-torneio";

// Criação rápida: só o essencial pra abrir o registro. Slug sai daqui — vai
// ser gerado a partir do nome (ver salvarTorneio) e só aparece pra editar na
// tela de detalhe. Descrição, banner, destaque, categorias e quadras
// bloqueadas também ficam pra lá (mesma ideia da ComandasPainel: abre com o
// nome, o resto depois). Tela normal, não modal, pra caber o calendário à
// vontade.
export function TorneioCriarForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [inscricoesAbremData, setInscricoesAbremData] = useState("");
  const [inscricoesAbremHora, setInscricoesAbremHora] = useState("");
  const [inscricoesFechamData, setInscricoesFechamData] = useState("");
  const [inscricoesFechamHora, setInscricoesFechamHora] = useState("");
  const [salvando, startTransition] = useTransition();

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!dataInicio || !dataFim) {
      toast.error("Escolha as datas do torneio.");
      return;
    }
    if (!inscricoesAbremData || !inscricoesAbremHora || !inscricoesFechamData || !inscricoesFechamHora) {
      toast.error("Escolha quando as inscrições abrem e fecham.");
      return;
    }
    startTransition(async () => {
      const resultado = await salvarTorneio({
        nome,
        dataInicio,
        dataFim,
        inscricoesAbrem: `${inscricoesAbremData}T${inscricoesAbremHora}`,
        inscricoesFecham: `${inscricoesFechamData}T${inscricoesFechamHora}`,
        destaqueHome: false,
        status: "RASCUNHO",
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Torneio criado.");
      router.push(`/gerenciamento/torneios/${resultado.torneioId}/edicao`);
    });
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/gerenciamento/torneios" />}>
          <ArrowLeft aria-hidden />
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="font-heading text-xl font-bold">Novo torneio</h1>
      </div>

      <form onSubmit={salvar} className="flex flex-col gap-4 rounded-xl border bg-background p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="torneio-nome">Nome</Label>
          <Input
            id="torneio-nome"
            required
            minLength={2}
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Começa</Label>
            <SeletorData valor={dataInicio} onAlterar={setDataInicio} className="w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Termina</Label>
            <SeletorData valor={dataFim} onAlterar={setDataFim} className="w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Inscrições abrem</Label>
          <div className="flex gap-2">
            <SeletorData valor={inscricoesAbremData} onAlterar={setInscricoesAbremData} className="flex-1" />
            <Input
              type="time"
              required
              aria-label="Horário em que as inscrições abrem"
              className="h-11 w-28 shrink-0"
              value={inscricoesAbremHora}
              onChange={(e) => setInscricoesAbremHora(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Inscrições fecham</Label>
          <div className="flex gap-2">
            <SeletorData valor={inscricoesFechamData} onAlterar={setInscricoesFechamData} className="flex-1" />
            <Input
              type="time"
              required
              aria-label="Horário em que as inscrições fecham"
              className="h-11 w-28 shrink-0"
              value={inscricoesFechamHora}
              onChange={(e) => setInscricoesFechamHora(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" className="h-11 self-start" disabled={salvando}>
          {salvando ? "Criando…" : "Criar torneio"}
        </Button>
      </form>
    </div>
  );
}
