import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { listarQuadrasAdmin } from "@/features/quadras/actions/listar-quadras-admin";
import { HorarioFuncionamentoForm } from "@/components/gerenciamento/horario-funcionamento-form";

// RF11: horário de funcionamento por quadra e dia da semana.
export default async function HorariosPage() {
  const quadras = await listarQuadrasAdmin();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 font-heading text-xl font-bold">
        Horário de funcionamento
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Defina, por quadra e dia da semana, de que hora até que hora ela abre.
        Dias desmarcados ficam fechados pra reserva.
      </p>

      {quadras.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma quadra cadastrada ainda.
        </p>
      ) : (
        <Accordion defaultValue={[quadras[0].id]}>
          {quadras.map((quadra) => (
            <AccordionItem key={quadra.id} value={quadra.id}>
              <AccordionTrigger>
                {quadra.nome}
                {!quadra.ativa && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (inativa)
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <HorarioFuncionamentoForm quadra={quadra} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
