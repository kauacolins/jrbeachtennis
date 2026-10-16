import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Imagem do evento (quadrada, recortada pelo object-cover) ou um placeholder
// neutro quando ainda não tem imagem. `className` define o tamanho.
export function ImagemEvento({
  imagemUrl,
  titulo,
  sizes,
  className,
}: {
  imagemUrl: string | null;
  titulo: string;
  sizes: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {imagemUrl ? (
        // A imagem já vem reduzida do upload (ver reduzirImagem), não precisa
        // passar pelo otimizador do Next.
        <Image src={imagemUrl} alt={titulo} fill sizes={sizes} unoptimized className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground/60">
          <ImageIcon className="size-1/3 max-h-10 max-w-10" aria-hidden />
        </div>
      )}
    </div>
  );
}
