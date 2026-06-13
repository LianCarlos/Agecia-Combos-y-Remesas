import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Mr Factus — Remesas Internacionales & Servicios Financieros",
  description:
    "Calculadora de remesas y catálogo de combos. Envíos rápidos y seguros. Mr Factus, tu conexión financiera.",
  keywords: ["remesas", "Cuba", "combos", "alimentos", "envíos", "servicios financieros", "Mr Factus"],
  authors: [{ name: "Mr Factus" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Mr Factus — Remesas Internacionales & Servicios Financieros",
    description:
      "Calculadora de remesas y catálogo de combos. Envíos rápidos y seguros.",
    type: "website",
    locale: "es_CU",
    siteName: "Mr Factus",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#003366" },
    { media: "(prefers-color-scheme: dark)", color: "#001a33" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} scroll-smooth`} data-scroll-behavior="smooth">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
