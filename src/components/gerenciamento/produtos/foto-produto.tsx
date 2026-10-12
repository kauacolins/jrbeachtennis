import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Foto do produto do bar (quadrada, recortada pelo object-cover) ou um
// placeholder neutro quando ainda não tem foto. `className` define o tamanho.
export function FotoProduto({
  fotoUrl,
  nome,
  sizes,
  className,
}: {
  fotoUrl: string | null;
  nome: string;
  sizes: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {fotoUrl ? (
        // A foto já vem reduzida do upload (ver reduzirImagem), não precisa
        // passar pelo otimizador do Next.
        <Image src={fotoUrl} alt={nome} fill sizes={sizes} unoptimized className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground/60">
          <ImageIcon className="size-1/3 max-h-10 max-w-10" aria-hidden />
        </div>
      )}
    </div>
  );
}
