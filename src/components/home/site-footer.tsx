import Image from "next/image";
import Link from "next/link";
import { Camera, MessageCircle } from "lucide-react";
import { obterHorarioGeral } from "@/features/quadras/actions/obter-horario-geral";

export async function SiteFooter() {
  const horario = await obterHorarioGeral();

  return (
    <footer id="contato" className="bg-brand-black text-brand-black-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center rounded-md bg-white p-1.5">
            <Image
              src="/logo.png"
              alt="Arena JR"
              width={240}
              height={80}
              className="h-9 w-auto"
            />
          </span>
          <p className="text-sm text-brand-black-foreground/70">
            {/* TODO: endereço real da arena */}
            Endereço: a confirmar
          </p>
          {horario && (
            <p className="text-sm text-brand-black-foreground/70">
              {horario}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm text-brand-black-foreground/70">
          <Link
            href="/#modalidades"
            className="hover:text-brand-black-foreground"
          >
            Modalidades
          </Link>
          <Link href="/termos" className="hover:text-brand-black-foreground">
            Termos
          </Link>
          <Link
            href="/privacidade"
            className="hover:text-brand-black-foreground"
          >
            Privacidade
          </Link>
        </div>

        <div className="flex gap-4">
          {/* TODO: link real do WhatsApp */}
          <a
            href="#"
            aria-label="WhatsApp da Arena JR"
            className="flex size-10 items-center justify-center rounded-full bg-brand-black-foreground/10 hover:bg-brand-black-foreground/20"
          >
            <MessageCircle aria-hidden />
          </a>
          {/* TODO: link real do Instagram */}
          <a
            href="#"
            aria-label="Instagram da Arena JR"
            className="flex size-10 items-center justify-center rounded-full bg-brand-black-foreground/10 hover:bg-brand-black-foreground/20"
          >
            <Camera aria-hidden />
          </a>
        </div>
      </div>

      <div className="border-t border-brand-black-foreground/10 py-4 text-center text-xs text-brand-black-foreground/60">
        © {new Date().getFullYear()} Arena JR. Todos os direitos reservados.
      </div>
    </footer>
  );
}
