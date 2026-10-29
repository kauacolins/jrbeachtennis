import { redirect } from "next/navigation";

// Login unificado em /entrar (equipe e cliente usam o mesmo formulário).
// Rota mantida só pra não quebrar links/favoritos antigos do acesso da equipe.
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: destino } = await searchParams;
  const params = new URLSearchParams();
  if (destino) params.set("redirect", destino);
  const query = params.toString();

  redirect(`/entrar${query ? `?${query}` : ""}`);
}
