import { z } from "zod";
import { StatusTorneio } from "@/app/generated/prisma/enums";
import { temNomeESobrenome } from "@/lib/comanda";

export const statusTorneioSchema = z.enum(StatusTorneio, {
  error: "Escolha a situação do torneio.",
});

const dataISOSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data.");
const datetimeLocalSchema = z.string().min(1, "Escolha a data e a hora.");
const slugSchema = z
  .string()
  .trim()
  .min(2, "Digite o slug.")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use só letras minúsculas, números e hífen (ex.: beneficente-2026).");

// RF: cadastro/edição do torneio (ver docs/TORNEIOS.md). O banner é enviado
// separado (File), como a foto do produto do bar. slug é opcional — sem ele
// (tela de criação), o servidor gera a partir do nome (ver salvarTorneio);
// a tela de detalhe manda o slug atual pra permitir editar.
export const salvarTorneioSchema = z
  .object({
    torneioId: z.string().min(1).optional(),
    slug: slugSchema.optional(),
    nome: z.string().trim().min(2, "Digite o nome.").max(120),
    descricao: z.string().trim().max(4000).optional(),
    doacao: z.string().trim().max(120).optional(),
    dataInicio: dataISOSchema,
    dataFim: dataISOSchema,
    inscricoesAbrem: datetimeLocalSchema,
    inscricoesFecham: datetimeLocalSchema,
    // vazio = sem limite (ver docs/TORNEIOS.md, "Decidido")
    maxCategoriasAtleta: z.coerce.number().int().min(1).max(20).optional(),
    destaqueHome: z.boolean().default(false),
    destaqueAte: z.union([datetimeLocalSchema, z.literal("")]).optional(),
    status: statusTorneioSchema,
  })
  .refine((d) => d.dataFim >= d.dataInicio, {
    error: "O fim não pode ser antes do início.",
    path: ["dataFim"],
  })
  .refine((d) => d.inscricoesFecham > d.inscricoesAbrem, {
    error: "As inscrições precisam fechar depois de abrir.",
    path: ["inscricoesFecham"],
  });

export type SalvarTorneioInput = z.input<typeof salvarTorneioSchema>;

// RF: cadastro/edição de categoria dentro de um torneio.
export const salvarCategoriaSchema = z
  .object({
    categoriaId: z.string().min(1).optional(),
    torneioId: z.string().min(1),
    modalidadeId: z.string().min(1, "Escolha a modalidade."),
    nome: z.string().trim().min(1, "Digite o nome da categoria.").max(80),
    minAtletas: z.coerce.number().int().min(1).max(50),
    maxAtletas: z.coerce.number().int().min(1).max(50),
    valorCentavos: z.coerce.number().int().min(0),
    vagas: z.coerce.number().int().min(1).optional(),
    inicioPrevisto: z.union([datetimeLocalSchema, z.literal("")]).optional(),
    ordem: z.coerce.number().int().min(0).default(0),
  })
  .refine((d) => d.maxAtletas >= d.minAtletas, {
    error: "O máximo precisa ser maior ou igual ao mínimo.",
    path: ["maxAtletas"],
  });

export type SalvarCategoriaInput = z.input<typeof salvarCategoriaSchema>;

// RF: bloquear quadra do torneio — mesma forma do bloqueio comum
// (features/bloqueios/schema.ts), só acrescentando o torneio.
export const bloquearQuadraTorneioSchema = z.object({
  torneioId: z.string().min(1),
  quadraId: z.string().min(1, "Escolha a quadra."),
  dataISO: dataISOSchema,
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida."),
  horaFim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida."),
  motivo: z.string().trim().max(120).optional(),
});

export type BloquearQuadraTorneioInput = z.infer<typeof bloquearQuadraTorneioSchema>;

const celularSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{10,11}$/, "Celular incompleto: informe com DDD."));

const atletaSchema = z.object({
  nome: z
    .string()
    .trim()
    .max(80)
    .refine(temNomeESobrenome, "Digite nome e sobrenome do atleta."),
  celular: celularSchema,
});

// RF: inscrição numa categoria (docs/TORNEIOS.md). Quem inscreve entra como
// o primeiro atleta; mínimo/máximo de atletas é checado contra a categoria
// na regra, não aqui (o schema só garante a forma dos dados).
export const inscreverSchema = z.object({
  categoriaId: z.string().min(1),
  nomeEquipe: z.string().trim().max(60).optional(),
  atletas: z.array(atletaSchema).min(1).max(50),
});

export type InscreverInput = z.input<typeof inscreverSchema>;
