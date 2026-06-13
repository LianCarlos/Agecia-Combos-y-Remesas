/**
 * Tests para useCombos hook
 * Capa 2 — Hook (mockea fetch, no toca Supabase)
 */

// ─── Mocks de fetch global ────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Imports ──────────────────────────────────────────────────────
import { renderHook, act } from "@testing-library/react";
import { useCombos } from "../useCombos";

// ─── Fixtures (campos en inglés: title, description, price_usd, image_url, available) ──
const mockCombosData = [
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("estado inicial: loading=true, combos vacíos, sin error", () => {
    // Fetch nunca resuelve para mantener loading=true
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useCombos());

    expect(result.current.loading).toBe(true);
    expect(result.current.combos).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("fetch exitoso retorna combos y loading=false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCombosData,
    });

    const { result } = renderHook(() => useCombos());

    // Inicialmente loading=true
    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.combos).toEqual(mockCombosData);
    expect(result.current.error).toBeNull();
  });

  it("fetch exitoso retorna combos con campos en inglés", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCombosData,
    });

    const { result } = renderHook(() => useCombos());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.combos[0].title).toBe("Combo Familiar");
    expect(result.current.combos[0].description).toBe("Para toda la familia");
    expect(result.current.combos[0].price_usd).toBe(49.99);
    expect(result.current.combos[0].image_url).toBeNull();
    expect(result.current.combos[0].available).toBe(true);
  });

  it("fetch fallido (response no ok) setea error y loading=false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useCombos());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Error al cargar combos");
    expect(result.current.combos).toEqual([]);
  });

  it("fetch lanza excepción setea error y loading=false", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCombos());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Error al cargar combos");
    expect(result.current.combos).toEqual([]);
  });

  it("retorna array vacío si el API retorna array vacío", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useCombos());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.combos).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
