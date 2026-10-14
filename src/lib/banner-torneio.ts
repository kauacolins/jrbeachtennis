// Banner horizontal do torneio (ver Torneio.bannerUrl, docs/TORNEIOS.md):
// 1920x640 (3:1), JPG ou WebP até 1 MB — guardado no Vercel Blob, diferente
// da foto de produto (que fica em bytes no Postgres).
export const BANNER_TIPOS_ACEITOS = ["image/jpeg", "image/webp"];
export const BANNER_TAMANHO_MAXIMO = 1024 * 1024;
