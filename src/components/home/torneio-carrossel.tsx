"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { TorneioDestacado } from "@/features/torneios/actions/listar-torneios-destacados";

// Mais de um torneio destacado: arrasta (Embla) + bolinhas pra trocar de
// slide direto (docs/TORNEIOS.md — "vira carrossel").
export function TorneioCarrossel({ torneios }: { torneios: TorneioDestacado[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (!api) return;
    setAtual(api.selectedScrollSnap());
    api.on("select", () => setAtual(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="flex flex-col gap-3">
      <Carousel setApi={setApi}>
        <CarouselContent className="-ml-0">
          {torneios.map((torneio) => (
            <CarouselItem key={torneio.id} className="pl-0">
              <Link
                href={`/torneios/${torneio.slug}`}
                className="relative block aspect-[3/1] w-full overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Image
                  src={torneio.bannerUrl!}
                  alt={torneio.nome}
                  fill
                  sizes="(min-width: 1280px) 1152px, 100vw"
                  className="object-cover"
                />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="flex justify-center gap-1.5" role="tablist" aria-label="Torneios em destaque">
        {torneios.map((torneio, indice) => (
          <button
            key={torneio.id}
            type="button"
            role="tab"
            aria-selected={indice === atual}
            aria-label={`Ver banner de ${torneio.nome}`}
            onClick={() => api?.scrollTo(indice)}
            className={cn(
              "size-2 rounded-full transition-colors",
              indice === atual ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
