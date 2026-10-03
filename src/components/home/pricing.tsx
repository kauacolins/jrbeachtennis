import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PricingCta } from "@/components/home/pricing-cta";
import { PRODUTOS_MOCK } from "@/lib/mock-data";
import { formatarPreco } from "@/lib/format";

export function Pricing() {
  return (
    <section id="precos" className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <h2 className="mb-8 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Preços
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {PRODUTOS_MOCK.map((produto) => (
            <Card
              key={produto.tipo}
              className={
                produto.destaque ? "border-primary ring-1 ring-primary" : ""
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-bold">
                    {produto.nome}
                  </h3>
                  {produto.destaque && (
                    <Badge className="bg-accent text-accent-foreground">
                      Mais vantajoso
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p>
                  <span className="font-heading text-3xl font-extrabold tabular-nums">
                    {formatarPreco(produto.precoCentavos)}
                  </span>{" "}
                  <span className="text-sm text-muted-foreground">
                    {produto.unidade}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {produto.descricao}
                </p>
                <PricingCta tipo={produto.tipo} destaque={produto.destaque} />
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Pagamento combinado no local — o sistema registra e a Arena JR
          confirma na entrada.
        </p>
      </div>
    </section>
  );
}
