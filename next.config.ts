import type { NextConfig } from "next";

// Orígenes permitidos para Server Actions.
// El Dev Tunnel de VS Code inyecta x-forwarded-host distinto al origin del
// browser, lo que hace que Next.js bloquee las Server Actions por CSRF.
// Estos orígenes de desarrollo SOLO se autorizan fuera de producción; en el
// build de producción no se relaja la protección CSRF.
const devOrigins = [
  "localhost:3000",
  "sft1tr4p-3000.use2.devtunnels.ms",
  ...(process.env.TUNNEL_ORIGIN ? [process.env.TUNNEL_ORIGIN] : []),
];

const nextConfig: NextConfig = {
  // Fija la raíz del proyecto para evitar la detección errónea de lockfiles
  // (hay un pnpm-lock.yaml en el home del usuario que confundía a Turbopack).
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ydgjnmbulsfsswmfgwap.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === "production" ? [] : devOrigins,
    },
  },
};

export default nextConfig;
