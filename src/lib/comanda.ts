/** Nome normalizado pra comparar duplicidade de comanda ("  joão " == "João"). */
export function normalizarNomeComanda(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}
