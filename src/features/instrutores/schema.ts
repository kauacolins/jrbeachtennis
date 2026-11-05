import { z } from "zod";
import { metodoPagamentoSchema } from "@/features/comandas/schema";

// Instrutores e alunos (docs/INSTRUTORES.md).

const telefoneOpcional = z
  .string()
  .trim()
  .regex(/^\d{8,11}$/, "Telefone inválido.")
  .optional()
  .or(z.literal(""));

const textoOpcional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const salvarInstrutorSchema = z.object({
  instrutorId: z.string().min(1).optional(),
  nome: z.string().trim().min(2, "Informe o nome.").max(120),
  telefone: telefoneOpcional,
  ativo: z.boolean().default(true),
});

export const salvarPlanoAulaSchema = z.object({
  planoId: z.string().min(1).optional(),
  instrutorId: z.string().min(1),
  nome: z.string().trim().min(2, "Dê um nome ao plano (ex.: 2x por semana).").max(60),
  precoCentavos: z.number().int().min(0, "Preço inválido."),
  duracaoDias: z.number().int().min(1).max(365).default(30),
  ativo: z.boolean().default(true),
});

// metodo nulo = a mensalidade fica em aberto (o aluno paga depois).
const metodoOuAberto = metodoPagamentoSchema.nullable();

export const matricularAlunoSchema = z.object({
  instrutorId: z.string().min(1),
  clienteId: z.string().min(1),
  planoAulaId: z.string().min(1, "Escolha o plano."),
  horario: textoOpcional(80),
  observacao: textoOpcional(300),
  metodo: metodoOuAberto,
});

export const editarAlunoSchema = z.object({
  alunoId: z.string().min(1),
  planoAulaId: z.string().min(1, "Escolha o plano."),
  horario: textoOpcional(80),
  observacao: textoOpcional(300),
});

export const renovarMensalidadeSchema = z.object({
  alunoId: z.string().min(1),
  metodo: metodoOuAberto,
});

export const registrarPagamentoSchema = z.object({
  alunoId: z.string().min(1),
  metodo: metodoPagamentoSchema,
});

export type SalvarInstrutorInput = z.input<typeof salvarInstrutorSchema>;
export type SalvarPlanoAulaInput = z.input<typeof salvarPlanoAulaSchema>;
export type MatricularAlunoInput = z.input<typeof matricularAlunoSchema>;
export type EditarAlunoInput = z.input<typeof editarAlunoSchema>;
export type RenovarMensalidadeInput = z.input<typeof renovarMensalidadeSchema>;
export type RegistrarPagamentoInput = z.input<typeof registrarPagamentoSchema>;
