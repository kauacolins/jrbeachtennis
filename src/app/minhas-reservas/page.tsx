import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarX2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReservaCard } from "@/components/reservas/reserva-card";
import { QuickSearch } from "@/components/reservas/quick-search";
import { getSessaoAtual } from "@/lib/get-session";
import { listarReservasUsuario } from "@/features/reservas/actions/listar-reservas-usuario";
import { listarModalidades } from "@/features/modalidades/actions/listar-modalidades";

export const metadata: Metadata = {
  title: "Minhas reservas | Arena JR",
};

export default async function MinhasReservasPage() {
  const sessao = await getSessaoAtual();
  if (!sessao?.user) {
    redirect("/entrar?redirect=/minhas-reservas");
  }

  const [reservas, modalidades] = await Promise.all([
    listarReservasUsuario(sessao.user.id),
    listarModalidades(),
  ]);
  const agora = new Date();

  const proximas = reservas
    .filter((r) => r.status === "CONFIRMADA" && r.inicio > agora)
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

  const anteriores = reservas.filter(
    (r) => !(r.status === "CONFIRMADA" && r.inicio > agora)
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Minhas reservas
      </h1>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Nova reserva
        </p>
        <QuickSearch modalidades={modalidades} />
      </div>

      <Tabs defaultValue="proximas">
        <TabsList>
          <TabsTrigger value="proximas">Próximas</TabsTrigger>
          <TabsTrigger value="anteriores">Anteriores</TabsTrigger>
        </TabsList>

        <TabsContent value="proximas" className="flex flex-col gap-3 pt-4">
          {proximas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
              <CalendarX2
                className="size-6 text-muted-foreground"
                aria-hidden
              />
              <p className="text-sm text-muted-foreground">
                Você não tem reservas futuras.
              </p>
            </div>
          ) : (
            proximas.map((reserva) => (
              <ReservaCard key={reserva.id} reserva={reserva} />
            ))
          )}
        </TabsContent>

        <TabsContent value="anteriores" className="flex flex-col gap-3 pt-4">
          {anteriores.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma reserva anterior ainda.
            </p>
          ) : (
            anteriores.map((reserva) => (
              <ReservaCard key={reserva.id} reserva={reserva} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
