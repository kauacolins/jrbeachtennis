"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// Botão que só executa a ação depois de confirmar num AlertDialog — usado
// em toda mutação de reserva do admin (RF15), tanto na listagem quanto no
// diálogo de detalhe, pra não deixar cancelar/marcar pago a um clique de
// distância por engano.
export function ConfirmarBotao({
  label,
  titulo,
  descricao,
  textoConfirmar,
  textoConfirmando,
  variant = "outline",
  actionVariant = "default",
  size,
  className,
  disabled,
  onConfirmar,
}: {
  label: ReactNode;
  titulo: string;
  descricao: string;
  textoConfirmar: string;
  textoConfirmando: string;
  variant?: ComponentProps<typeof Button>["variant"];
  actionVariant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  disabled?: boolean;
  onConfirmar: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant={variant} size={size} className={className} disabled={disabled} />}
      >
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            disabled={disabled}
            onClick={onConfirmar}
          >
            {disabled ? textoConfirmando : textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
