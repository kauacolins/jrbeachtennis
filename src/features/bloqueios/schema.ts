import { z } from "zod";

const horaSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida.");

export const criarBloqueioSchema = z.object({
  quadraId: z.string().min(1, "Escolha a quadra."),
  dataISO: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data."),
  horaInicio: horaSchema,
  horaFim: horaSchema,
  motivo: z.string().trim().max(120).optional(),
});

export type CriarBloqueioInput = z.infer<typeof criarBloqueioSchema>;
