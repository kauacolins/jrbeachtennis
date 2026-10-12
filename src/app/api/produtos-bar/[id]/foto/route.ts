import { prisma } from "@/lib/prisma";

// Serve a foto do produto do bar guardada no banco. Pública (é foto de
// cardápio) e com cache longo: a URL leva ?v=<fotoAtualizadaEm>, então foto
// nova = URL nova (ver urlFotoProduto).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const produto = await prisma.produtoBar.findUnique({
    where: { id },
    select: { foto: true, fotoTipo: true },
  });
  if (!produto?.foto || !produto.fotoTipo) {
    return new Response("Foto não encontrada.", { status: 404 });
  }

  return new Response(new Uint8Array(produto.foto), {
    headers: {
      "Content-Type": produto.fotoTipo,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
