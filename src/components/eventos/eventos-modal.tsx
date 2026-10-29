"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Megaphone, Trophy, XIcon } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventoFeedItem } from "@/features/eventos/actions/listar-eventos-ativos";

const CHAVE_LOCALSTORAGE = "eventos-vistos";
// Telas internas (admin, login) não mostram o modal — é só pro visitante do
// site público.
const ROTAS_SEM_MODAL = ["/gerenciamento", "/admin", "/entrar"];

function lerVistos(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCALSTORAGE);
    return bruto ? JSON.parse(bruto) : [];
  } catch {
    return [];
  }
}

function marcarVistos(chaves: string[]) {
  try {
    const vistos = new Set(lerVistos());
    for (const chave of chaves) vistos.add(chave);
    localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify([...vistos]));
  } catch {
    // localStorage indisponível (navegação anônima restrita, etc.) — só não persiste
  }
}

function infoTipo(chave: string) {
  const torneio = chave.startsWith("torneio:");
  return {
    label: torneio ? "Torneio" : "Aviso",
    icone: torneio ? Trophy : Megaphone,
  };
}

// Modal que abre ao entrar no site com avisos ativos e torneios de inscrição
// aberta (ver listarEventosAtivos, montado em layout.tsx). Visual de pôster
// vertical 4:5 (o formato do banner do torneio, 1080x1350) pra chamar mais
// atenção que uma lista simples. "Visto" é guardado por item no localStorage, não por
// sessão — um evento novo sempre aparece de novo, mesmo que o visitante já
// tenha fechado o modal de outro evento antes.
// Aviso não tem página de detalhe própria (texto completo já vem no feed e é
// mostrado aqui mesmo); só torneio navega, pra tela de inscrição.
export function EventosModal({ eventos }: { eventos: EventoFeedItem[] }) {
  const pathname = usePathname();
  const [pendentes, setPendentes] = useState<EventoFeedItem[]>([]);
  const [aberto, setAberto] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [atual, setAtual] = useState(0);
  const jaChecou = useRef(false);

  const escondido = ROTAS_SEM_MODAL.some((rota) => pathname.startsWith(rota));

  useEffect(() => {
    if (escondido || jaChecou.current) return;
    jaChecou.current = true;

    const vistos = new Set(lerVistos());
    const restantes = eventos.filter((e) => !vistos.has(e.chave));
    if (restantes.length === 0) return;
    setPendentes(restantes);
    setAberto(true);
  }, [escondido, eventos]);

  useEffect(() => {
    if (!api) return;
    setAtual(api.selectedScrollSnap());
    api.on("select", () => setAtual(api.selectedScrollSnap()));
  }, [api]);

  function fechar(abrir: boolean) {
    if (!abrir) marcarVistos(pendentes.map((e) => e.chave));
    setAberto(abrir);
  }

  if (escondido || pendentes.length === 0) return null;

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-sm"
      >
        <DialogTitle className="sr-only">Novidades da Arena JR</DialogTitle>
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 z-20 rounded-full bg-background/90 shadow-sm backdrop-blur-sm hover:bg-background"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Fechar</span>
        </DialogClose>

        <Carousel setApi={setApi}>
          <CarouselContent className="-ml-0">
            {pendentes.map((item) => {
              const tipo = infoTipo(item.chave);
              const Icone = tipo.icone;
              const conteudoMidia = item.imagemUrl ? (
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={item.imagemUrl}
                    alt={item.titulo}
                    fill
                    sizes="(min-width: 640px) 384px, 100vw"
                    unoptimized
                    className="object-cover"
                  />
                  <Badge
                    variant={tipo.label === "Torneio" ? "default" : "secondary"}
                    className="absolute top-3 left-3"
                  >
                    {tipo.label}
                  </Badge>
                </div>
              ) : (
                // Sem foto: em vez do pôster vazio 4:5, uma faixa curta com
                // ícone + badge — dá mais espaço e destaque pro texto abaixo.
                <div className="flex items-center gap-3 bg-gradient-to-br from-primary/15 to-primary/5 px-4 py-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background/80 text-primary">
                    <Icone className="size-5" aria-hidden />
                  </span>
                  <Badge variant={tipo.label === "Torneio" ? "default" : "secondary"}>
                    {tipo.label}
                  </Badge>
                </div>
              );

              return (
                <CarouselItem key={item.chave} className="pl-0">
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => fechar(false)}
                      className="relative block w-full overflow-hidden bg-muted outline-none"
                    >
                      {conteudoMidia}
                    </Link>
                  ) : (
                    <div className="relative block w-full overflow-hidden bg-muted">
                      {conteudoMidia}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex flex-col gap-1">
                      <p className="font-heading text-lg font-semibold tracking-tight">
                        {item.titulo}
                      </p>
                      {item.resumo && (
                        <p className="text-sm text-muted-foreground">{item.resumo}</p>
                      )}
                    </div>

                    {item.descricao && (
                      <p className="max-h-40 overflow-y-auto text-sm whitespace-pre-wrap text-foreground/80">
                        {item.descricao}
                      </p>
                    )}

                    {item.href ? (
                      <Button
                        size="lg"
                        className="h-11 w-full"
                        render={<Link href={item.href} />}
                        nativeButton={false}
                        onClick={() => fechar(false)}
                      >
                        Garantir vaga
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="h-11 w-full"
                        onClick={() => fechar(false)}
                      >
                        Entendi
                      </Button>
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {pendentes.length > 1 && (
          <div
            className="flex justify-center gap-1.5 pb-4"
            role="tablist"
            aria-label="Novidades"
          >
            {pendentes.map((item, indice) => (
              <button
                key={item.chave}
                type="button"
                role="tab"
                aria-selected={indice === atual}
                aria-label={`Ver ${item.titulo}`}
                onClick={() => api?.scrollTo(indice)}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  indice === atual ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
