import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ModalidadeNaoEncontrada() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-24 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-lg font-semibold">Modalidade não encontrada</h1>
      <p className="text-sm text-muted-foreground">
        Ela pode ter sido desativada ou o link está incorreto.
      </p>
      <Button render={<Link href="/#modalidades" />} className="h-11">
        Ver modalidades
      </Button>
    </div>
  );
}
