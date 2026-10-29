import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Smart Cell Import | Seu próximo favorito",
    template: "%s | Smart Cell Import",
  },
  description:
    "Explore o catálogo da Smart Cell Import. Escolha seus favoritos e consulte nossa equipe pelo WhatsApp.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Smart Cell Import",
  },
};
export const viewport: Viewport = { themeColor: "#160951" };
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-xl bg-white p-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
