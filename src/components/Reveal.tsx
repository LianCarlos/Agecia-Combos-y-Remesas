"use client";

import { useReveal } from "@/hooks/useReveal";

/**
 * Envuelve contenido para que aparezca con un fade + slide suave al entrar
 * en pantalla. Acepta un `delay` (ms) para escalonar varias secciones.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? ({ ["--reveal-delay" as string]: `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
