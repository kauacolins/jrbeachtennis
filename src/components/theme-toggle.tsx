"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={
        montado && resolvedTheme === "dark"
          ? "Mudar para o tema claro"
          : "Mudar para o tema escuro"
      }
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {montado && resolvedTheme === "dark" ? (
        <Sun aria-hidden />
      ) : (
        <Moon aria-hidden />
      )}
    </Button>
  );
}
