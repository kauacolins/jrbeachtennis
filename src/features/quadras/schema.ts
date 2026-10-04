import { z } from "zod";

const horaSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida.");

export const horarioDiaSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  fechada: z.boolean(),
  abre: horaSchema,
  fecha: horaSchema,
});

export const atualizarHorarioFuncionamentoSchema = z.object({
  quadraId: z.string().min(1),
  dias: z.array(horarioDiaSchema).length(7),
});

export type AtualizarHorarioFuncionamentoInput = z.infer<
  typeof atualizarHorarioFuncionamentoSchema
>;

// RF10: CRUD de quadras.
export const quadraSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da quadra.").max(80),
  descricao: z.string().trim().max(500).optional(),
  fotoUrl: z
    .string()
    .trim()
    .url("Informe uma URL válida.")
    .max(500)
    .optional()
    .or(z.literal("")),
  precoHoraCentavos: z.number().int().min(0, "Preço inválido."),
  ativa: z.boolean(),
  modalidadeIds: z.array(z.string().min(1)).min(1, "Escolha ao menos uma modalidade."),
});

export type QuadraInput = z.infer<typeof quadraSchema>;

export const criarQuadraSchema = quadraSchema;
export const atualizarQuadraSchema = quadraSchema.extend({
  quadraId: z.string().min(1),
});

export type CriarQuadraInput = z.infer<typeof criarQuadraSchema>;
export type AtualizarQuadraInput = z.infer<typeof atualizarQuadraSchema>;
