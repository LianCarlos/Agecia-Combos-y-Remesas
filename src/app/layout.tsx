import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  // metadataBase hace que las URLs de Open Graph/Twitter/canonical se resuelvan
  // como absolutas (sin esto salían relativas y rotas al compartir).
  metadataBase: new URL("https://www.mrfactusremesas.com"),
  title: "Mr Factus — Remesas Internacionales & Servicios Financieros",
  description:
    "Calculadora de remesas y catálogo de combos. Envíos rápidos y seguros. Mr Factus, tu conexión financiera.",
  keywords: ["remesas", "Cuba", "combos", "alimentos", "envíos", "servicios financieros", "Mr Factus", "recargas Cuba"],
  authors: [{ name: "Mr Factus" }],
  applicationName: "Mr Factus",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Mr Factus — Remesas Internacionales & Servicios Financieros",
    description:
      "Calculadora de remesas y catálogo de combos. Envíos rápidos y seguros.",
    url: "/",
    type: "website",
    locale: "es_CU",
    siteName: "Mr Factus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mr Factus — Remesas Internacionales a Cuba",
    description: "Calculadora de remesas, combos y recargas a Cuba. Envíos rápidos y seguros.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Verde de marca (antes era azul #003366, incoherente con la identidad).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#006847" },
    { media: "(prefers-color-scheme: dark)", color: "#004d33" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
