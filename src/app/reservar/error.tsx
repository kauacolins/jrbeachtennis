"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReservarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-24 text-center">
      <TriangleAlert className="size-8 text-destructive" aria-hidden />
      <h1 className="text-lg font-semibold">Não foi possível carregar</h1>
      <p className="text-sm text-muted-foreground">
        Algo deu errado do nosso lado. Tente de novo em alguns instantes.
      </p>
      <Button className="h-11" onClick={reset}>
        Tentar de novo
      </Button>
    </div>
  );
}
