// "Torneio Beneficente 2026" -> "torneio-beneficente-2026". Usado como
// sugestão inicial no cadastro do torneio (o admin pode editar à mão).
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
