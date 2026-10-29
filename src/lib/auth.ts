import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { enviarEmail } from "@/lib/email";

export const googleAuthHabilitado = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Vale pra cliente e equipe: os dois usam o mesmo login em /entrar.
    resetPasswordTokenExpiresIn: 60 * 60, // 1h
    sendResetPassword: async ({ user, url }) => {
      await enviarEmail({
        para: user.email,
        assunto: "Redefinir senha — Arena JR",
        html: `
          <p>Olá, ${user.name}.</p>
          <p>Recebemos um pedido para redefinir a senha da sua conta na Arena JR.</p>
          <p><a href="${url}">Clique aqui para criar uma nova senha</a>.</p>
          <p>Esse link expira em 1 hora. Se você não pediu isso, pode ignorar este e-mail.</p>
        `,
      });
    },
  },
  socialProviders: googleAuthHabilitado
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : undefined,
  user: {
    additionalFields: {
      // RF01: pedido no cadastro por e-mail/senha; no Google, pedido depois.
      telefone: {
        type: "string",
        required: false,
      },
    },
  },
  // Precisa ser o último plugin: lê/escreve o cookie de sessão em Server
  // Actions e Route Handlers sem precisar repassar headers manualmente.
  plugins: [nextCookies()],
});
