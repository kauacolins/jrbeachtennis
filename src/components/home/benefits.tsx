import Image from "next/image";
import { CalendarX2, ListChecks, RadioTower, Tag } from "lucide-react";

const BENEFICIOS = [
  {
    icone: RadioTower,
    titulo: "Horários em tempo real",
    descricao: "A agenda que você vê é a agenda real, sem precisar confirmar por mensagem.",
  },
  {
    icone: Tag,
    titulo: "Preço claro antes de reservar",
    descricao: "Valor da diária, day use e mensal sempre visíveis, sem surpresa na hora de pagar.",
  },
  {
    icone: ListChecks,
    titulo: "Suas reservas num só lugar",
    descricao: "Veja as próximas e as passadas sem precisar procurar print de conversa.",
  },
  {
    icone: CalendarX2,
    titulo: "Cancelamento pelo próprio site",
    descricao: "Até 24h antes do horário, sem precisar ligar pra ninguém.",
  },
] as const;

export function Benefits() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="grid gap-8 sm:grid-cols-2 sm:items-center sm:gap-12">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
          <Image
            src="/images/jogadores.jpg"
            alt="Jogadores comemorando um ponto na quadra da Arena JR"
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Para quem joga
          </h2>
          <ul className="flex flex-col gap-5">
            {BENEFICIOS.map((b) => (
              <li key={b.titulo} className="flex gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-brand-text">
                  <b.icone className="size-4" aria-hidden />
                </div>
                <div>
                  <h3 className="font-medium">{b.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {b.descricao}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
