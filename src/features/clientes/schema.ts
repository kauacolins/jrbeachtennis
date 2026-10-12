import { z } from "zod";

// Cadastro simplificado do balcão (docs/COMANDAS.md): nome e sobrenome pra
// diferenciar xarás; telefone é opcional, só ajuda a achar a pessoa depois.
export const criarClienteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(60),
  sobrenome: z.string().trim().min(2, "Informe o sobrenome.").max(60),
  telefone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^(\d{10,11})?$/, "Telefone incompleto: informe com DDD ou deixe em branco."))
    .optional(),
});

export type CriarClienteInput = z.input<typeof criarClienteSchema>;
