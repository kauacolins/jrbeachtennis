import { z } from "zod";

// Aviso mostrado no modal de entrada do site (ver listarEventosAtivos).
// data/hora combinam numa única data (yyyy-MM-dd + HH:mm), ambas opcionais.
export const eventoSchema = z.object({
  titulo: z.string().trim().min(2, "Informe o título.").max(80),
  resumo: z.string().trim().max(140).optional().or(z.literal("")),
  descricao: z.string().trim().max(2000).optional().or(z.literal("")),
  data: z.string().optional().or(z.literal("")),
  hora: z.string().optional().or(z.literal("")),
  ativo: z.boolean(),
});

export const salvarEventoSchema = eventoSchema.extend({
  eventoId: z.string().min(1).optional(),
});

export type SalvarEventoInput = z.infer<typeof salvarEventoSchema>;
