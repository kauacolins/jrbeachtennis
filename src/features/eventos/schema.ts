import { z } from "zod";

// Aviso mostrado no modal de entrada do site (ver listarEventosAtivos).
// data/hora combinam numa única data (yyyy-MM-dd + HH:mm), ambas opcionais.
// exibicaoInicio/exibicaoFim ("yyyy-MM-dd", também opcionais) são o período
// em que o aviso aparece no modal — fora dele fica escondido mesmo com
// ativo=true, sem precisar desativar à mão.
export const eventoSchema = z
  .object({
    titulo: z.string().trim().min(2, "Informe o título.").max(80),
    resumo: z.string().trim().max(140).optional().or(z.literal("")),
    descricao: z.string().trim().max(2000).optional().or(z.literal("")),
    data: z.string().optional().or(z.literal("")),
    hora: z.string().optional().or(z.literal("")),
    exibicaoInicio: z.string().optional().or(z.literal("")),
    exibicaoFim: z.string().optional().or(z.literal("")),
    ativo: z.boolean(),
  })
  .refine(
    (v) => !v.exibicaoInicio || !v.exibicaoFim || v.exibicaoFim >= v.exibicaoInicio,
    { message: "O fim da exibição não pode ser antes do início.", path: ["exibicaoFim"] }
  );

export const salvarEventoSchema = eventoSchema.and(
  z.object({ eventoId: z.string().min(1).optional() })
);

export type SalvarEventoInput = z.infer<typeof salvarEventoSchema>;
