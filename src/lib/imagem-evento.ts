// Imagem do evento (ver Evento.imagem no schema). O ?v= muda quando a
// imagem muda, então a rota pode mandar cache "immutable".
export function urlImagemEvento(eventoId: string, imagemAtualizadaEm: Date | null) {
  if (!imagemAtualizadaEm) return null;
  return `/api/eventos/${eventoId}/imagem?v=${imagemAtualizadaEm.getTime()}`;
}

export const IMAGEM_EVENTO_TIPOS_ACEITOS = ["image/webp", "image/jpeg", "image/png"];
// A imagem já chega reduzida pelo navegador (ver reduzirImagem); o limite é só
// uma trava contra upload sem redução.
export const IMAGEM_EVENTO_TAMANHO_MAXIMO = 500 * 1024;
