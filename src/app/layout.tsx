import type { Metadata } from "next";
import { Archivo, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { EventosModal } from "@/components/eventos/eventos-modal";
import { listarEventosAtivos } from "@/features/eventos/actions/listar-eventos-ativos";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["wdth"],
  weight: "variable",
});

// O layout raiz busca os eventos ativos (ver EventosModal) pra toda página
// embaixo dele, inclusive as que não têm esse revalidate próprio — sem
// isso, página totalmente estática (ex.: /contato) travaria o feed no que
// existia no último build. Mesmo intervalo da home.
export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "Arena JR | Beach Tennis",
  description:
    "Reserve quadras de beach tennis, futebol e vôlei na Arena JR. Horários livres em tempo real, confirmação em poucos toques.",
  openGraph: {
    title: "Arena JR | Beach Tennis",
    description:
      "Reserve quadras de beach tennis, futebol e vôlei na Arena JR.",
    locale: "pt_BR",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const eventos = await listarEventosAtivos();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${archivo.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <EventosModal eventos={eventos} />
        </ThemeProvider>
      </body>
    </html>
  );
}
