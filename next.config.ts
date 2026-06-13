import type { NextConfig } from "next";

// Orígenes permitidos para Server Actions.
// El Dev Tunnel de VS Code inyecta x-forwarded-host diferente al origin del browser,
// lo que hace que Next.js bloquee las Server Actions por CSRF.
// Añadimos los orígenes del tunnel y de localhost aquí.
const allowedOrigins = [
  "localhost:3000",
  // Dev Tunnels de VS Code — añade aquí la URL del tunnel activo si cambia
  "sft1tr4p-3000.use2.devtunnels.ms",
  // También acepta desde env var para no tener que editar este archivo cada vez
  ...(process.env.TUNNEL_ORIGIN ? [process.env.TUNNEL_ORIGIN] : []),
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
