/** Texto comparável numa busca: sem acento e em minúsculas ("João" → "joao"). */
export function normalizarBusca(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Filtra `itens` pelo termo digitado, comparando com os campos que `campos`
 * devolve (nulos são ignorados). Termo vazio devolve a lista inteira.
 */
export function filtrarPorBusca<T>(
  itens: T[],
  busca: string,
  campos: (item: T) => (string | null | undefined)[]
): T[] {
  const termo = normalizarBusca(busca.trim());
  if (!termo) return itens;
  return itens.filter((item) =>
    campos(item).some((campo) => campo && normalizarBusca(campo).includes(termo))
  );
}
