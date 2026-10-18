// Banner vertical do torneio (ver Torneio.bannerUrl, docs/TORNEIOS.md):
// 1080x1350 (4:5, formato de post do Instagram, então a mesma arte serve
// pras redes), JPG ou WebP até 1 MB — guardado no Vercel Blob, diferente da
// foto de produto (que fica em bytes no Postgres).
export const BANNER_LARGURA = 1080;
export const BANNER_ALTURA = 1350;
export const BANNER_TIPOS_ACEITOS = ["image/jpeg", "image/webp"];
export const BANNER_TAMANHO_MAXIMO = 1024 * 1024;
