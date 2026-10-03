import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { ModalidadeIcon } from "@/components/quadras/modalidade-icon";
import { BookingWidget } from "@/components/reservas/booking-widget";
import type { DiaDisponivel } from "@/components/reservas/seletor-dia";
import { obterModalidadeResumo } from "@/features/modalidades/actions/listar-modalidades-resumo";
import { listarHorariosDisponiveisPorModalidade } from "@/features/reservas/actions/listar-horarios-disponiveis-modalidade";
import { FOTO_POR_MODALIDADE } from "@/lib/mock-data";
import { adicionarDias, diaSemanaDaData } from "@/lib/datas";
import { TIME_ZONE, JANELA_MAXIMA_DIAS } from "@/lib/constants";
import { formatarPreco } from "@/lib/format";

// Dias (0=domingo...6=sábado) em que ao menos uma quadra dessa modalidade abre.
async function diasAbertosPorModalidade(modalidadeId: string) {
  const quadras = await prisma.quadra.findMany({
    where: { ativa: true, modalidades: { some: { id: modalidadeId } } },
    include: { horarios: { select: { diaSemana: true } } },
  });
  const abertos = new Set<number>();
  for (const quadra of quadras) {
    for (const h of quadra.horarios) abertos.add(h.diaSemana);
  }
  return abertos;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modalidadeId: string }>;
}): Promise<Metadata> {
  const { modalidadeId } = await params;
  const modalidade = await obterModalidadeResumo(modalidadeId);
  if (!modalidade) return {};

  const descricao = `A partir de ${formatarPreco(modalidade.precoDesdeCentavos)} por hora. Reserve seu horário de ${modalidade.nome} na Arena JR.`;
  const foto = FOTO_POR_MODALIDADE[modalidade.nome.toLowerCase()];

  return {
    title: `${modalidade.nome} | Arena JR`,
    description: descricao,
    openGraph: {
      title: modalidade.nome,
      description: descricao,
      images: foto ? [foto] : undefined,
    },
  };
}

export default async function ReservarModalidadePage({
  params,
  searchParams,
}: {
  params: Promise<{ modalidadeId: string }>;
  searchParams: Promise<{ data?: string; hora?: string }>;
}) {
  const { modalidadeId } = await params;
  const { data, hora } = await searchParams;
  const modalidade = await obterModalidadeResumo(modalidadeId);
  if (!modalidade) notFound();

  const hojeISO = formatInTimeZone(new Date(), TIME_ZONE, "yyyy-MM-dd");
  const diasAbertos = await diasAbertosPorModalidade(modalidadeId);

  const dias: DiaDisponivel[] = Array.from(
    { length: JANELA_MAXIMA_DIAS },
    (_, i) => {
      const dataISO = adicionarDias(hojeISO, i);
      const diaSemana = diaSemanaDaData(dataISO);
      return { dataISO, diaSemana, fechada: !diasAbertos.has(diaSemana) };
    }
  );

  const dataInicial =
    data && dias.some((d) => d.dataISO === data) ? data : hojeISO;
  const horaInicial = hora && /^\d{2}:\d{2}$/.test(hora) ? hora : undefined;

  const slotsIniciais = await listarHorariosDisponiveisPorModalidade(
    modalidadeId,
    dataInicial
  );

  const foto = FOTO_POR_MODALIDADE[modalidade.nome.toLowerCase()];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:py-8">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted sm:aspect-video">
        {foto ? (
          <Image
            src={foto}
            alt={`Quadra de ${modalidade.nome} na Arena JR`}
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ModalidadeIcon
              nome={modalidade.nome}
              className="size-12 text-muted-foreground"
              aria-hidden
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {modalidade.nome}
        </h1>
        <p className="text-sm text-muted-foreground">
          A partir de {formatarPreco(modalidade.precoDesdeCentavos)} por hora
          · {modalidade.quadrasCount}{" "}
          {modalidade.quadrasCount === 1 ? "quadra" : "quadras"}
        </p>
      </div>

      <BookingWidget
        modalidade={{
          id: modalidade.id,
          nome: modalidade.nome,
          precoHoraCentavos: modalidade.precoDesdeCentavos,
        }}
        dias={dias}
        slotsIniciais={slotsIniciais}
        hojeISO={hojeISO}
        dataInicial={dataInicial}
        horaInicial={horaInicial}
      />
    </div>
  );
}
