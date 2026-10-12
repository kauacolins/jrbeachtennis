/** Nome normalizado pra comparar duplicidade de comanda ("  joão " == "João"). */
export function normalizarNomeComanda(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

/** Nome + sobrenome: pelo menos duas palavras com 2+ letras ("Ana Souza"). */
export function temNomeESobrenome(nome: string) {
  return nome.trim().split(/\s+/).filter((parte) => parte.length >= 2).length >= 2;
}
