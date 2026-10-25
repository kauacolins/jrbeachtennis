import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exigirAdmin } from "@/lib/require-admin";
import { prepararModeloEvento } from "@/features/eventos/actions/preparar-modelo";
import { VALORES_EVENTO_VAZIOS, obterModeloEvento, hrefModeloEvento } from "@/features/eventos/modelos";
import { EventoForm } from "@/components/gerenciamento/eventos/evento-form";

const PERGUNTA_PARAMETRO = {
  modalidade: "Qual modalidade?",
  quadra: "Qual quadra?",
} as const;

// Cadastro de evento. ?modelo= abre já preenchido a partir de uma sugestão
// (ver MODELOS_EVENTO); se o modelo depende de uma modalidade ou quadra e
// ?opcao= não veio, pergunta antes de mostrar o formulário.
export default async function NovoEventoPage({
  searchParams,
}: {
  searchParams: Promise<{ modelo?: string; opcao?: string }>;
}) {
  if (!(await exigirAdmin())) redirect("/gerenciamento");

  const { modelo: modeloId, opcao } = await searchParams;
  const preparado = await prepararModeloEvento(modeloId, opcao);

  if (!preparado) return <EventoForm evento={null} valoresIniciais={VALORES_EVENTO_VAZIOS} />;

  if (preparado.tipo === "valores") {
    return <EventoForm evento={null} valoresIniciais={preparado.valores} origem={preparado.nomeModelo} />;
  }

  // obterModeloEvento não falha aqui: prepararModeloEvento já achou o modelo
  const modelo = obterModeloEvento(modeloId)!;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/gerenciamento/eventos" />}>
          <ArrowLeft aria-hidden />
          <span className="sr-only">Voltar</span>
        </Button>
        <div className="flex flex-col">
          <h1 className="font-heading text-xl font-bold">{preparado.nomeModelo}</h1>
          <p className="text-sm text-muted-foreground">{PERGUNTA_PARAMETRO[preparado.parametro]}</p>
        </div>
      </div>

      {preparado.opcoes.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma {preparado.parametro} cadastrada.{" "}
          <Link href="/gerenciamento/eventos/novo" className="font-medium text-foreground underline">
            Criar aviso em branco
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl border bg-background">
          {preparado.opcoes.map((o) => (
            <li key={o.id}>
              <Link
                href={hrefModeloEvento(modelo, o.id)}
                className="flex h-12 items-center justify-between px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {o.nome}
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
