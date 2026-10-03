import { Card, CardContent } from "@/components/ui/card";
import { DEPOIMENTOS_MOCK } from "@/lib/mock-data";

// Oculto por padrão em app/page.tsx até existirem depoimentos reais —
// os dados aqui são só placeholders (ver TODO em lib/mock-data.ts).
export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <h2 className="mb-8 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        Quem já jogou
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {DEPOIMENTOS_MOCK.map((depoimento, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm">&ldquo;{depoimento.frase}&rdquo;</p>
              <div className="text-sm">
                <p className="font-medium">{depoimento.nome}</p>
                <p className="text-muted-foreground">
                  {depoimento.modalidade}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
