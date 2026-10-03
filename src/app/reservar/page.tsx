import { redirect } from "next/navigation";

// Como não há mais um catálogo de quadras, reservar sempre parte de uma
// modalidade (ver /reservar/[modalidadeId]). Isto aqui é só uma rede de
// segurança para links antigos: com modalidade na query string, repassa
// pra rota certa; sem ela, volta pra seção de modalidades da home.
export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{
    modalidade?: string;
    data?: string;
    hora?: string;
  }>;
}) {
  const { modalidade, data, hora } = await searchParams;
  if (!modalidade) redirect("/#modalidades");

  const params = new URLSearchParams();
  if (data) params.set("data", data);
  if (hora) params.set("hora", hora);
  const query = params.toString();

  redirect(`/reservar/${modalidade}${query ? `?${query}` : ""}`);
}
