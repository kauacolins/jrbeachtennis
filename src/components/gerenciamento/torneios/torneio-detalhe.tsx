"use client";

import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TorneioDadosForm } from "@/components/gerenciamento/torneios/torneio-dados-form";
import { CategoriaLista } from "@/components/gerenciamento/torneios/categoria-lista";
import { BloqueioTorneioLista } from "@/components/gerenciamento/torneios/bloqueio-torneio-lista";
import type { TorneioDetalhe as TorneioDetalheDados } from "@/features/torneios/actions/obter-torneio";
import type { Modalidade } from "@/features/modalidades/actions/listar-modalidades";
import type { QuadraAdmin } from "@/features/quadras/actions/listar-quadras-admin";

// Tela de edição (/edicao): dados gerais, categorias e quadras bloqueadas,
// todos editáveis direto na página (sem diálogo) — são muitos campos e duas
// listas pra caber numa janela só (docs/TORNEIOS.md). A visão geral
// (TorneioVisaoGeral) fica em /gerenciamento/torneios/[id].
export function TorneioDetalhe({
  torneio,
  modalidades,
  quadras,
  bannerUploadHabilitado,
}: {
  torneio: TorneioDetalheDados;
  modalidades: Modalidade[];
  quadras: QuadraAdmin[];
  bannerUploadHabilitado: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href={`/gerenciamento/torneios/${torneio.id}`} />}
        >
          <ArrowLeft aria-hidden />
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="flex-1 font-heading text-xl font-bold">Editar {torneio.nome}</h1>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/gerenciamento/torneios/${torneio.id}/inscritos`} />}
        >
          <Users aria-hidden />
          Inscritos
        </Button>
      </div>

      <TorneioDadosForm torneio={torneio} bannerUploadHabilitado={bannerUploadHabilitado} />
      <CategoriaLista torneioId={torneio.id} categorias={torneio.categorias} modalidades={modalidades} />
      <BloqueioTorneioLista torneioId={torneio.id} bloqueios={torneio.bloqueios} quadras={quadras} />
    </div>
  );
}
