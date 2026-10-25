// Link wa.me com a mensagem já escrita. Aceita o telefone em qualquer
// formato (só dígitos ou "(11) 98765-4321") e põe o DDI 55 quando falta.
// Sem dígitos, devolve null (quem chama esconde/desabilita o botão).
export function linkWhatsapp(telefone: string, mensagem: string) {
  const digitos = telefone.replace(/\D/g, "");
  if (!digitos) return null;
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
