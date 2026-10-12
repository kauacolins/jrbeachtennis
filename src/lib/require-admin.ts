import { prisma } from "@/lib/prisma";
import { getSessaoAtual } from "@/lib/get-session";
import { Role } from "@/app/generated/prisma/enums";

const PAPEIS_GERENCIAMENTO: Role[] = [Role.ADMIN, Role.OPERATOR];

// RNF03: toda rota e mutação do /gerenciamento checa o perfil no servidor,
// nunca só no front — chamado tanto pelo layout quanto por cada Server Action.
export async function exigirAdmin() {
  const sessao = await getSessaoAtual();
  if (!sessao?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { id: true, name: true, role: true, removidoEm: true },
  });
  if (!user || user.removidoEm || !PAPEIS_GERENCIAMENTO.includes(user.role)) return null;

  return user;
}

// Configuração que mexe em preço (produtos do bar, day use, mensal) fica só
// com o ADMIN; o operador do balcão só lança e fecha comandas.
export async function exigirSomenteAdmin() {
  const user = await exigirAdmin();
  if (!user || user.role !== Role.ADMIN) return null;
  return user;
}
