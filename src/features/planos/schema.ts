import { z } from "zod";
import { metodoPagamentoSchema } from "@/features/comandas/schema";

// RF20: ativar ou renovar o mensal no balcão, já pago.
export const ativarPlanoSchema = z.object({
  clienteId: z.string().min(1),
  metodo: metodoPagamentoSchema,
});

export type AtivarPlanoInput = z.infer<typeof ativarPlanoSchema>;
