// Next.js 16 exporta configuración "flat" nativa de ESLint 9, así que ya no se
// necesita FlatCompat (@eslint/eslintrc), que provocaba un error de estructura
// circular al validar el plugin de React con ESLint 9.39+.
import next from "eslint-config-next";

const eslintConfig = [
  {
    ignores: ["coverage/**", ".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...next,
  {
    // Las reglas nuevas de React Compiler que Next 16 activó marcan patrones
    // preexistentes y funcionales (fetch en efectos, derivar estado en render).
    // Se dejan como aviso —visibles para limpieza gradual— sin bloquear el build.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/refs": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
];

export default eslintConfig;
