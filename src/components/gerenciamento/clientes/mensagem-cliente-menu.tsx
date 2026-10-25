"use client";

import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { linkWhatsapp } from "@/lib/whatsapp";
import { modelosMensagemCliente } from "@/components/gerenciamento/clientes/mensagens-cliente";

// Atalho de WhatsApp no card da lista de clientes: abre os modelos
// genéricos (sem consulta ao consumo) e cada um já vai pro wa.me com o
// texto pronto. Sem telefone, o botão fica desabilitado com o motivo.
export function MensagemClienteMenu({
  nome,
  telefone,
  siteUrl,
  className,
}: {
  nome: string;
  telefone: string | null;
  siteUrl: string;
  className?: string;
}) {
  if (!telefone) {
    return (
      <Button variant="outline" size="lg" disabled className={className} title="Cliente sem telefone">
        <MessageCircle aria-hidden />
        Sem telefone
      </Button>
    );
  }

  const modelos = modelosMensagemCliente(nome, siteUrl);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="lg" className={className} aria-label={`Mandar mensagem para ${nome}`}>
            <MessageCircle aria-hidden />
            Mensagem
          </Button>
        }
      />
      <PopoverContent align="end" className="w-72 gap-1.5 p-1.5">
        <p className="px-2 pt-1 text-xs font-medium text-muted-foreground">Enviar no WhatsApp</p>
        <ul className="flex flex-col">
          {modelos.map(({ id, label, descricao, icone: Icone, texto }) => {
            const href = linkWhatsapp(telefone, texto);
            if (!href) return null;
            return (
              <li key={id}>
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-2 py-1.5 outline-none transition-colors",
                    "hover:bg-muted focus-visible:bg-muted active:bg-muted"
                  )}
                >
                  <Icone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="truncate text-xs text-muted-foreground">{descricao}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
