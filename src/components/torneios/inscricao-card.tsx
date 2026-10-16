import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CancelarInscricaoBotao } from "@/components/torneios/cancelar-inscricao-botao";
import { PixInstrucoes } from "@/components/torneios/pix-instrucoes";
import { formatarDataCurta, formatarPreco } from "@/lib/format";
import type { MinhaInscricao } from "@/features/torneios/actions/listar-minhas-inscricoes";

// Mesma semântica de cor das Minhas reservas (ver reserva-card.tsx):
// warning = aguardando pagamento, accent = confirmada, muted = cancelada.
const STATUS_INFO: Record<MinhaInscricao["status"], { label: string; className: string }> = {
  PENDENTE: { label: "Aguardando pagamento", className: "bg-warning text-warning-foreground" },
  CONFIRMADA: { label: "Confirmada", className: "bg-accent text-accent-foreground" },
  CANCELADA: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
};

export function InscricaoCard({ inscricao }: { inscricao: MinhaInscricao }) {
  const info = STATUS_INFO[inscricao.status];
  const { torneio } = inscricao.categoria;

  return (
    <div className="flex gap-3 rounded-xl border p-4">
      <Link
        href={`/torneios/${torneio.slug}`}
        className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {torneio.bannerUrl ? (
          <Image
            src={torneio.bannerUrl}
            alt={torneio.nome}
            fill
            sizes="64px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Trophy className="size-6 text-muted-foreground" aria-hidden />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/torneios/${torneio.slug}`} className="font-medium hover:underline">
              {torneio.nome}
            </Link>
            <p className="text-sm text-muted-foreground">
              {inscricao.categoria.nome} · {formatarDataCurta(torneio.dataInicio)}
            </p>
          </div>
          <Badge className={info.className}>{info.label}</Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {inscricao.atletas.map((a) => a.nome).join(" · ")} · {formatarPreco(inscricao.valorCentavos)}
        </p>

        {inscricao.status === "PENDENTE" && <PixInstrucoes />}
        {inscricao.status !== "CANCELADA" && (
          <CancelarInscricaoBotao inscricaoId={inscricao.id} />
        )}
      </div>
    </div>
  );
}
