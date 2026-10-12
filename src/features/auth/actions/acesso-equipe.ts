"use server";

import { exigirAdmin } from "@/lib/require-admin";

// Login da equipe (/admin) separado do login de cliente (/entrar): depois do
// signIn no navegador, cada tela pergunta ao servidor se a sessão é de
// equipe (ADMIN/OPERATOR) — o papel não vem na sessão do Better Auth.
export async function sessaoEhDaEquipe(): Promise<boolean> {
  return Boolean(await exigirAdmin());
}
