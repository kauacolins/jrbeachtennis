import { redirect } from "next/navigation";
import { exigirSomenteAdmin } from "@/lib/require-admin";
import { TorneioCriarForm } from "@/components/gerenciamento/torneios/torneio-criar-form";

export default async function NovoTorneioPage() {
  if (!(await exigirSomenteAdmin())) redirect("/gerenciamento");

  return <TorneioCriarForm />;
}
