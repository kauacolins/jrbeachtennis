// Só no navegador: reduz a foto escolhida (às vezes 5 MB de câmera de
// celular) pra no máximo 512 px no lado maior, em WebP — fica em torno de
// 20–40 KB, pequeno o bastante pra guardar no banco (ver ProdutoBar.foto).
const LADO_MAXIMO = 512;
const QUALIDADE = 0.82;

export async function reduzirImagem(arquivo: File): Promise<File> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Canvas indisponível.");
  contexto.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALIDADE)
  );
  if (!blob) throw new Error("Não foi possível converter a imagem.");

  // Navegador sem encoder WebP devolve PNG — o servidor aceita os dois.
  const extensao = blob.type === "image/webp" ? "webp" : "png";
  return new File([blob], `foto.${extensao}`, { type: blob.type });
}
