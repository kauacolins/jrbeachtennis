import { z } from "zod";
import { MetodoPagamento } from "@/app/generated/prisma/enums";
import { temNomeESobrenome } from "@/lib/comanda";

export const metodoPagamentoSchema = z.enum(MetodoPagamento, {
  error: "Escolha a forma de pagamento.",
});

export const abrirComandaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Digite o nome da pessoa.")
    .max(60)
    .refine(temNomeESobrenome, "Digite nome e sobrenome da pessoa."),
});

export const fecharComandaSchema = z.object({
  comandaId: z.string().min(1),
  metodo: metodoPagamentoSchema,
});

export const fecharComandasSchema = z.object({
  comandaIds: z.array(z.string().min(1)).min(1, "Selecione pelo menos uma comanda.").max(200),
  metodo: metodoPagamentoSchema,
});

export const adicionarDayUseSchema = z.object({
  comandaId: z.string().min(1),
  clienteId: z.string().min(1),
});

export const adicionarReservaSchema = z.object({
  comandaId: z.string().min(1),
  reservaId: z.string().min(1),
});

// Tela "Pedido": itens escolhidos antes, depois a comanda — uma aberta
// (comandaId) ou uma nova pelo nome (novoNome).
export const lancarPedidoSchema = z
  .object({
    comandaId: z.string().min(1).optional(),
    novoNome: abrirComandaSchema.shape.nome.optional(),
    itens: z
      .array(
        z.object({
          produtoId: z.string().min(1),
          quantidade: z.number().int().min(1).max(99),
        })
      )
      .min(1, "Escolha pelo menos um produto.")
      .max(50),
  })
  .refine((d) => Boolean(d.comandaId) !== Boolean(d.novoNome), {
    error: "Escolha a comanda.",
  });

export type LancarPedidoInput = z.input<typeof lancarPedidoSchema>;
