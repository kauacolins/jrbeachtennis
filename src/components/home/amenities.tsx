import { Beer, DoorOpen, SquareParking, Sun, Waves } from "lucide-react";
import { AMENIDADES_MOCK } from "@/lib/mock-data";

const ICONES = { Waves, Sun, DoorOpen, SquareParking, Beer } as const;

export function Amenities() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <h2 className="mb-6 text-sm font-medium text-muted-foreground">
          Estrutura da arena
        </h2>
        <ul className="flex flex-wrap gap-x-8 gap-y-4">
          {AMENIDADES_MOCK.map((item) => {
            const Icone = ICONES[item.icone];
            return (
              <li
                key={item.label}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Icone className="size-4 text-brand-text" aria-hidden />
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
