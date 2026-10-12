"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

// "Sair" do gerenciamento: volta pro login da equipe (/admin) — não pra
// área do cliente. Com `nome`, mostra a saudação ao lado (só no desktop;
// no celular o botão fica dentro do menu hambúrguer, sem saudação).
export function SairEquipe({ nome, className }: { nome?: string; className?: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      {nome && <span className="text-sm font-medium">Olá, {nome.split(" ")[0]}</span>}
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
