// Abas da lista de alunos (?filtro= na URL). Fora do componente client
// pra page.tsx validar o searchParam no servidor.
export type FiltroAluno = "todos" | "em_dia" | "vencendo" | "em_aberto" | "vencidos" | "inativos";

export const FILTROS_ALUNO: FiltroAluno[] = ["todos", "em_dia", "vencendo", "em_aberto", "vencidos", "inativos"];

export function ehFiltroAluno(valor: unknown): valor is FiltroAluno {
  return FILTROS_ALUNO.includes(valor as FiltroAluno);
}
