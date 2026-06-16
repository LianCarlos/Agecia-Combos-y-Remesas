"use client";

import type { Product } from "@/types";

/**
 * Devuelve los productos precargados desde el servidor (page.tsx) como props.
 * Ya no hace fetch al cliente: los datos vienen sembrados por SSR.
 */
export function useProducts(initialData: Product[] = []) {
  return { products: initialData, loading: false, error: null as string | null };
}
