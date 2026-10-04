import Image from "next/image";
import { Clock3, ShieldCheck, Wallet } from "lucide-react";
import { QuickSearch } from "@/components/reservas/quick-search";
import { listarModalidades } from "@/features/modalidades/actions/listar-modalidades";

const SELOS = [
  { icone: Clock3, label: "Reserva online 24h" },
  { icone: Wallet, label: "Pagamento no local" },
  { icone: ShieldCheck, label: "Cancelamento grátis até 24h antes" },
];

export async function Hero() {
  const modalidades = await listarModalidades();

  return (
    <section className="relative isolate overflow-hidden bg-brand-black text-brand-black-foreground">
      <Image
        src="/images/hero-quadra-2.png"
        alt="Quadra de areia iluminada da Arena JR à noite"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-60"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/70 to-brand-black/30"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:py-24">
        <p className="text-sm font-medium text-primary">
          Cansou de mandar mensagem pra saber se tem horário?
        </p>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-6xl">
          Sua quadra, no seu horário
        </h1>
        <p className="max-w-prose text-base text-brand-black-foreground/80 sm:text-lg">
          Escolha a modalidade, veja os horários livres e reserve em poucos
          toques.
        </p>

        <div className="mt-2 max-w-3xl">
          <QuickSearch modalidades={modalidades} />
        </div>

        <ul className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-8">
          {SELOS.map((selo) => (
            <li
              key={selo.label}
              className="flex items-center gap-2 text-sm text-brand-black-foreground/80"
            >
              <selo.icone className="size-4 text-primary" aria-hidden />
              {selo.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
