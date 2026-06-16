"use client";

import type { Combo } from "@/types";

/**
 * Devuelve los combos precargados desde el servidor (page.tsx) como props.
 * Ya no hace fetch al cliente: los datos vienen sembrados por SSR.
 */
export function useCombos(initialData: Combo[] = []) {
  return { combos: initialData, loading: false, error: null as string | null };
}
