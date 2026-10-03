import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PERGUNTAS = [
  {
    pergunta: "Como eu reservo um horário?",
    resposta:
      "Escolha a quadra e a modalidade, veja os horários livres na agenda do dia e toque no horário que quiser. Duração de 1h a 3h, sempre em blocos de hora cheia.",
  },
  {
    pergunta: "Como eu pago?",
    resposta:
      "O pagamento é combinado no local — a reserva fica registrada no sistema e a Arena JR confirma quando você chega.",
  },
  {
    pergunta: "Até quando posso cancelar?",
    resposta:
      "Até 24h antes do horário marcado, direto pelo site. Depois desse prazo, é só falando com a Arena JR.",
  },
  {
    pergunta: "O que é o day use?",
    resposta:
      "Entrada livre no espaço o dia todo, sem quadra exclusiva — você joga nas quadras que estiverem livres. Custa R$ 15 por pessoa, por data.",
  },
  {
    pergunta: "Como funciona o mensal?",
    resposta:
      "Por R$ 120, você fica com day use liberado por 30 dias: o passe do dia sai por R$ 0 enquanto o plano estiver ativo.",
  },
] as const;

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <h2 className="mb-8 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        Perguntas frequentes
      </h2>
      <Accordion>
        {PERGUNTAS.map((item) => (
          <AccordionItem key={item.pergunta}>
            <AccordionTrigger className="text-base">
              {item.pergunta}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.resposta}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
