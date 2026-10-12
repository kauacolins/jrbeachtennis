// Foto do produto do bar (ver ProdutoBar.foto no schema). O ?v= muda quando a
// foto muda, então a rota pode mandar cache "immutable".
export function urlFotoProduto(produtoId: string, fotoAtualizadaEm: Date | null) {
  if (!fotoAtualizadaEm) return null;
  return `/api/produtos-bar/${produtoId}/foto?v=${fotoAtualizadaEm.getTime()}`;
}

export const FOTO_TIPOS_ACEITOS = ["image/webp", "image/jpeg", "image/png"];
// A foto já chega reduzida pelo navegador (ver reduzirImagem); o limite é só
// uma trava contra upload sem redução.
export const FOTO_TAMANHO_MAXIMO = 500 * 1024;
