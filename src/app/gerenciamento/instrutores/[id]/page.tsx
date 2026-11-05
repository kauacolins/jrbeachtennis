import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/require-admin";
import { obterInstrutor } from "@/features/instrutores/actions/listar-instrutores";
import { InstrutorDetalhe } from "@/components/gerenciamento/instrutores/instrutor-detalhe";
import { ehFiltroAluno } from "@/components/gerenciamento/instrutores/filtros-aluno";
import { PIX_CHAVE_ARENA, PIX_TITULAR_ARENA } from "@/lib/constants";

// Alunos do instrutor: matricular, renovar, receber e mandar as mensagens
// prontas no WhatsApp (docs/INSTRUTORES.md).
export default async function InstrutorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filtro?: string }>;
}) {
  const usuario = await exigirAdmin();
  if (!usuario) return null;

  const [{ id }, { filtro }] = await Promise.all([params, searchParams]);
  const detalhe = await obterInstrutor(id);
  if (!detalhe) notFound();

  return (
    <InstrutorDetalhe
      detalhe={detalhe}
      filtro={ehFiltroAluno(filtro) ? filtro : "todos"}
      podeEditar={usuario.role === "ADMIN"}
      pix={PIX_CHAVE_ARENA && PIX_TITULAR_ARENA ? { chave: PIX_CHAVE_ARENA, titular: PIX_TITULAR_ARENA } : null}
    />
  );
}
