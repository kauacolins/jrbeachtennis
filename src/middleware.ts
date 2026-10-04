import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const ROTAS_PROTEGIDAS = ["/minhas-reservas", "/perfil", "/gerenciamento"];

// Guarda de rede pras rotas logadas: roda antes de qualquer Server
// Component, em toda navegação (link, refresh, voltar/avançar, URL direta).
// Só checa se o cookie de sessão existe (rápido, sem bater no banco) — a
// validação de verdade continua em getSessaoAtual() dentro da página.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protegida = ROTAS_PROTEGIDAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );
  if (!protegida) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = new URL("/entrar", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/minhas-reservas/:path*", "/perfil/:path*", "/gerenciamento/:path*"],
};
