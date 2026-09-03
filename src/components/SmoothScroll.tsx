"use client";

import { useEffect } from "react";
import { smoothScrollToId } from "@/lib/smooth-scroll";

/**
 * Intercepta clics en cualquier enlace de ancla de la misma página
 * (`<a href="#seccion">`) y aplica el scroll suave con easing propio.
 * Cubre los CTAs del hero, el footer, etc. sin tener que cablear cada uno.
 *
 * Los enlaces que ya llaman a `preventDefault()` por su cuenta (p. ej. el
 * navbar, que además cierra el menú móvil) se saltan aquí gracias al chequeo
 * de `defaultPrevented`, así no se animan dos veces.
 */
export function SmoothScroll() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      // Respeta clics con modificadores / botón secundario (abrir en pestaña, etc.).
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;

      const id = href.slice(1);
      if (!document.getElementById(id)) return;

      e.preventDefault();
      smoothScrollToId(id);
      // Refleja la sección en la URL sin provocar un salto del navegador.
      history.pushState(null, "", href);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
