import { z } from "zod";
import {
  DURACAO_MAXIMA_MIN,
  DURACAO_MINIMA_MIN,
  PASSO_RESERVA_MIN,
} from "@/lib/constants";

export const criarReservaSchema = z.object({
  quadraId: z.string().min(1),
  modalidadeId: z.string().min(1),
  inicioISO: z.string().datetime(),
  duracaoMinutos: z
    .number()
    .int()
    .min(DURACAO_MINIMA_MIN)
    .max(DURACAO_MAXIMA_MIN)
    .multipleOf(PASSO_RESERVA_MIN, "A duração precisa ser em blocos de meia hora."),
  nomeContato: z.string().trim().min(2, "Informe seu nome.").max(80),
  telefoneContato: z
    .string()
    .trim()
    .min(8, "Informe um telefone válido.")
    .max(20),
});

export type CriarReservaInput = z.infer<typeof criarReservaSchema>;

// Reserva feita pelo admin (Nova reserva na agenda): o contato vem do
// cadastro de clientes do balcão, não de campos digitados.
export const criarReservaAdminSchema = criarReservaSchema
  .omit({ nomeContato: true, telefoneContato: true })
  .extend({ clienteId: z.string().min(1, "Escolha o cliente.") });

export type CriarReservaAdminInput = z.infer<typeof criarReservaAdminSchema>;

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
