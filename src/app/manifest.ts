import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mr Factus — Remesas y Combos a Cuba",
    short_name: "Mr Factus",
    description: "Calculadora de remesas, combos y recargas a Cuba. Rápido y seguro.",
    start_url: "/",
    display: "standalone",
    background_color: "#f0f7f4",
    theme_color: "#006847",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
