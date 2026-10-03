import { z } from "zod";
import { DURACAO_MAXIMA_HORAS, DURACAO_MINIMA_HORAS } from "@/lib/constants";

export const criarReservaSchema = z.object({
  quadraId: z.string().min(1),
  modalidadeId: z.string().min(1),
  inicioISO: z.string().datetime(),
  duracaoHoras: z.number().int().min(DURACAO_MINIMA_HORAS).max(DURACAO_MAXIMA_HORAS),
  nomeContato: z.string().trim().min(2, "Informe seu nome.").max(80),
  telefoneContato: z
    .string()
    .trim()
    .min(8, "Informe um telefone válido.")
    .max(20),
});

export type CriarReservaInput = z.infer<typeof criarReservaSchema>;

// Sem quadraId: o cliente escolhe modalidade + horário, a quadra é
// atribuída pelo servidor entre as que oferecem aquela modalidade.
export const criarReservaModalidadeSchema = criarReservaSchema.omit({
  quadraId: true,
});

export type CriarReservaModalidadeInput = z.infer<
  typeof criarReservaModalidadeSchema
>;
