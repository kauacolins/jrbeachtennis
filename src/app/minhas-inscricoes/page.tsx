import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { InscricaoCard } from "@/components/torneios/inscricao-card";
import { getSessaoAtual } from "@/lib/get-session";
import { listarMinhasInscricoes } from "@/features/torneios/actions/listar-minhas-inscricoes";

export const metadata: Metadata = {
  title: "Minhas inscrições | Arena JR",
};

export default async function MinhasInscricoesPage() {
  const sessao = await getSessaoAtual();
  if (!sessao?.user) {
    redirect("/entrar?redirect=/minhas-inscricoes");
  }

  const inscricoes = await listarMinhasInscricoes(sessao.user.id);

  const ativas = inscricoes
    .filter((i) => i.status !== "CANCELADA")
    .sort(
      (a, b) =>
        a.categoria.torneio.dataInicio.getTime() - b.categoria.torneio.dataInicio.getTime()
    );
  const canceladas = inscricoes.filter((i) => i.status === "CANCELADA");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Minhas inscrições</h1>

      {inscricoes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <Trophy className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Você ainda não se inscreveu em nenhum torneio.
          </p>
          <Button render={<Link href="/torneios" />} nativeButton={false} size="sm">
            Ver torneios abertos
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="ativas">
          <TabsList>
            <TabsTrigger value="ativas">Ativas</TabsTrigger>
            <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
          </TabsList>

          <TabsContent value="ativas" className="flex flex-col gap-3 pt-4">
            {ativas.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhuma inscrição ativa agora.
              </p>
            ) : (
              ativas.map((inscricao) => (
                <InscricaoCard key={inscricao.id} inscricao={inscricao} />
              ))
            )}
          </TabsContent>

          <TabsContent value="canceladas" className="flex flex-col gap-3 pt-4">
            {canceladas.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhuma inscrição cancelada.
              </p>
            ) : (
              canceladas.map((inscricao) => (
                <InscricaoCard key={inscricao.id} inscricao={inscricao} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
