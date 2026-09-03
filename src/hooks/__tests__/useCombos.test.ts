/**
 * Tests para useCombos / useProducts.
 *
 * Arquitectura actual: los catálogos se siembran desde el servidor (SSR) y se
 * pasan como initialData. Los hooks ya NO hacen fetch en el cliente: devuelven
 * los datos recibidos con loading=false y error=null.
 */

import { renderHook } from "@testing-library/react";
import { useCombos } from "../useCombos";
import { useProducts } from "../useProducts";
import type { Combo, Product } from "@/types";

const mockCombos: Combo[] = [
  {
    id: "combo-1",
    title: "Combo Familiar",
    description: "Para toda la familia",
    price_usd: 49.99,
    image_url: null,
    available: true,
    created_at: "2026-01-01",
    updated_at: "2026-06-01",
  },
  {
    id: "combo-2",
    title: "Combo Individual",
    description: "Para una persona",
    price_usd: 29.99,
    image_url: null,
    available: true,
    created_at: "2026-01-01",
    updated_at: "2026-06-01",
  },
];

describe("useCombos", () => {
  it("sin initialData devuelve lista vacía, sin loading y sin error", () => {
    const { result } = renderHook(() => useCombos());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.combos).toEqual([]);
  });

  it("devuelve los combos sembrados desde el servidor", () => {
    const { result } = renderHook(() => useCombos(mockCombos));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.combos).toHaveLength(2);
    expect(result.current.combos[0].title).toBe("Combo Familiar");
    expect(result.current.combos[0].price_usd).toBe(49.99);
  });
});

describe("useProducts", () => {
  const mockProducts: Product[] = [
    {
      id: "prod-1",
      title: "Aceite de Oliva",
      description: "900 ML",
      price_usd: 2.5,
      image_url: null,
      active: true,
      created_at: "2026-01-01",
      updated_at: "2026-06-01",
    },
  ];

  it("sin initialData devuelve lista vacía, sin loading y sin error", () => {
    const { result } = renderHook(() => useProducts());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.products).toEqual([]);
  });

  it("devuelve los productos sembrados desde el servidor", () => {
    const { result } = renderHook(() => useProducts(mockProducts));
    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].title).toBe("Aceite de Oliva");
  });
});
