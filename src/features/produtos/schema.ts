import { z } from "zod";

// RF30: produto do bar.
export const produtoBarSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(60),
  categoria: z.string().trim().max(30).optional().or(z.literal("")),
  precoCentavos: z.number().int().min(0, "Preço inválido."),
  ativo: z.boolean(),
});

export const salvarProdutoBarSchema = produtoBarSchema.extend({
  produtoId: z.string().min(1).optional(),
});

export type SalvarProdutoBarInput = z.infer<typeof salvarProdutoBarSchema>;

// RF17/RF18: preço do day use e do mensal, e limite diário do day use.
export const atualizarProdutoSchema = z.object({
  produtoId: z.string().min(1),
  precoCentavos: z.number().int().min(0, "Preço inválido."),
  limiteDiario: z.number().int().min(1, "Limite precisa ser pelo menos 1.").nullable(),
  ativo: z.boolean(),
});

export type AtualizarProdutoInput = z.infer<typeof atualizarProdutoSchema>;
