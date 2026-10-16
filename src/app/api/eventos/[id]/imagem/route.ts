import { prisma } from "@/lib/prisma";

// Serve a imagem do evento guardada no banco. Pública e com cache longo: a
// URL leva ?v=<imagemAtualizadaEm>, então imagem nova = URL nova (ver
// urlImagemEvento).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evento = await prisma.evento.findUnique({
    where: { id },
    select: { imagem: true, imagemTipo: true },
  });
  if (!evento?.imagem || !evento.imagemTipo) {
    return new Response("Imagem não encontrada.", { status: 404 });
  }

  return new Response(new Uint8Array(evento.imagem), {
    headers: {
      "Content-Type": evento.imagemTipo,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
