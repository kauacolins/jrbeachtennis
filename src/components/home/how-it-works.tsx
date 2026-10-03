import { CalendarDays, CheckCircle2, Timer } from "lucide-react";

const PASSOS = [
  {
    icone: CalendarDays,
    titulo: "Escolha modalidade e dia",
    descricao: "Beach tennis, futebol ou vôlei — veja a agenda de cada quadra.",
  },
  {
    icone: Timer,
    titulo: "Pegue o horário livre",
    descricao: "A grade mostra só os horários disponíveis, na hora.",
  },
  {
    icone: CheckCircle2,
    titulo: "Confirme e jogue",
    descricao: "Nome e telefone, pronto. O pagamento é combinado no local.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <h2 className="mb-8 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        Como funciona
      </h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {PASSOS.map((passo, i) => (
          <div key={passo.titulo} className="flex flex-col gap-2">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-brand-text">
              <passo.icone className="size-5" aria-hidden />
            </div>
            <h3 className="font-medium">
              {i + 1}. {passo.titulo}
            </h3>
            <p className="text-sm text-muted-foreground">{passo.descricao}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
