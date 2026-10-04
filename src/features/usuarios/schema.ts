import { z } from "zod";
import { Role } from "@/app/generated/prisma/enums";

// CRUD de usuários de equipe (admin/operador/instrutor) — cliente não entra
// aqui, essa conta nasce pelo cadastro público em /entrar.
export const PAPEIS_EQUIPE = [Role.ADMIN, Role.OPERATOR, Role.INTRUCTOR] as const;

const papelEquipeSchema = z.enum(PAPEIS_EQUIPE);

export const criarUsuarioSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  telefone: z
    .string()
    .trim()
    .regex(/^\d{8,11}$/, "Telefone inválido.")
    .optional()
    .or(z.literal("")),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(128),
  role: papelEquipeSchema,
});

export const atualizarUsuarioSchema = z.object({
  usuarioId: z.string().min(1),
  nome: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  telefone: z
    .string()
    .trim()
    .regex(/^\d{8,11}$/, "Telefone inválido.")
    .optional()
    .or(z.literal("")),
  role: papelEquipeSchema,
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
