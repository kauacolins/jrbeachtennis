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

// CPF só entra aqui, na hora de gerar o Pix — não é salvo na Reserva (ver
// criarPagamentoPix). O Mercado Pago exige identificação do pagador pra
// cobrança via Pix.
export const criarPagamentoPixSchema = z.object({
  reservaId: z.string().min(1),
  cpf: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "Informe um CPF válido."),
});

export type CriarPagamentoPixInput = z.infer<typeof criarPagamentoPixSchema>;
