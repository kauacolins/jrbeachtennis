import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:py-16">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          Bora jogar?
        </h2>
        <p className="max-w-prose text-sm text-primary-foreground/80 sm:text-base">
          Veja os horários livres agora e garanta sua quadra na Arena JR.
        </p>
        <Button
          size="lg"
          className="h-11 bg-foreground px-6 text-background hover:bg-foreground/90"
          render={<a href="#modalidades" />}
        >
          Reservar horário
        </Button>
      </div>
    </section>
  );
}
