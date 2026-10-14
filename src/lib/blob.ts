import { put, del } from "@vercel/blob";

// Sem o token (dev sem .env preenchido ou ambiente que não seja a Vercel), o
// upload de banner fica desativado — mesma ideia do pagamentoPixHabilitado
// em lib/mercadopago.ts.
export const blobHabilitado = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function enviarParaBlob(caminho: string, arquivo: File) {
  if (!blobHabilitado) {
    throw new Error("Armazenamento de arquivos não configurado (BLOB_READ_WRITE_TOKEN ausente).");
  }
  const { url } = await put(caminho, arquivo, {
    access: "public",
    addRandomSuffix: true,
  });
  return url;
}

// Best-effort: se a URL antiga não existir mais ou não for do Blob, ignora —
// nunca pode travar a troca/remoção do banner por isso.
export async function removerDoBlob(url: string) {
  if (!blobHabilitado) return;
  try {
    await del(url);
  } catch {
    // ignora
  }
}
