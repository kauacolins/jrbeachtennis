"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

// "Sair" do gerenciamento: volta pro login da equipe (/admin) — não pra
// área do cliente. Com `nome`, mostra avatar (iniciais) + saudação.
export function SairEquipe({ nome, className }: { nome?: string; className?: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      {nome && (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
              {iniciais(nome)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">Olá, {nome.split(" ")[0]}</span>
        </div>
      )}
      <Button
        variant="ghost"
        className={cn("h-11", className)}
        onClick={async () => {
          await signOut();
          router.push("/admin");
          router.refresh();
        }}
      >
        Sair
      </Button>
    </div>
  );
}
