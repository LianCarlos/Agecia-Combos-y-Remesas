"use client";

import { useEffect, useRef } from "react";

/**
 * Comportamiento estándar de un modal/diálogo accesible:
 *  - cierra con la tecla Escape
 *  - bloquea el scroll del <body> mientras está abierto
 *  - devuelve el foco al elemento que lo abrió al cerrarse
 *
 * Pensado para componentes de modal que se montan solo cuando están abiertos
 * (render condicional): el efecto corre una vez al montar y limpia al desmontar.
 */
export function useModalBehavior(onClose: () => void) {
  const cb = useRef(onClose);
  // Mantener la referencia al último onClose sin escribir durante el render.
  useEffect(() => {
    cb.current = onClose;
  });

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevActive = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cb.current();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
  }, []);
}
