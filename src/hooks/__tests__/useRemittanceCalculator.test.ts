/**
 * Tests para useRemittanceCalculator hook
 * Capa 2 — Hook (mockea fetch, no toca Supabase)
 *
 * Contrato actual:
 *  - Al montar (sin initialData) hace 4 fetches: payment-methods, delivery-methods,
 *    countries, exchange-rates (matriz de tasas).
 *  - calculate() calcula primero desde la matriz en memoria; si no encuentra la
 *    combinación, hace fallback a /api/exchange-rates con parámetros.
 *  - Si la carga inicial falla, intenta la caché local; si no hay, setea error.
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { renderHook, act } from "@testing-library/react";
import { useRemittanceCalculator } from "../useRemittanceCalculator";

// ─── Fixtures ─────────────────────────────────────────────────────
const mockPaymentMethods = [
  { id: "pm-1", name: "Zelle", active: true, currency_id: null, created_at: "2026-01-01" },
  { id: "pm-2", name: "Western Union", active: true, currency_id: null, created_at: "2026-01-01" },
];

const mockDeliveryMethods = [
  { id: "dm-1", name: "Efectivo USD", active: true, type: "cash", created_at: "2026-01-01" },
  { id: "dm-2", name: "Transferencia Bancaria", active: true, type: "transfer", created_at: "2026-01-01" },
];

const mockMatrix = [
  {
    paymentMethodId: "pm-1",
    deliveryMethodId: "dm-1",
    paymentMethod: "Zelle",
    deliveryMethod: "Efectivo USD",
    currencyCode: "USD",
    currencySymbol: "$",
    rate: 97.5,
    updatedAt: "2026-01-01",
  },
];

/** Encola los 4 fetches de carga inicial. */
function mockMount(rates: unknown[] = []) {
  mockFetch
    .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
    .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: true, json: async () => rates });
}

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("useRemittanceCalculator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  // ─── Estado inicial ─────────────────────────────────────────────
  it("estado inicial: isLoading=true, sin selecciones, sin error", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useRemittanceCalculator());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.paymentMethods).toEqual([]);
    expect(result.current.deliveryMethods).toEqual([]);
    expect(result.current.selectedPaymentMethod).toBeNull();
    expect(result.current.selectedDeliveryMethod).toBeNull();
    expect(result.current.originCountry).toBe("");
    expect(result.current.originCurrency).toBe("USD");
    expect(result.current.amount).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.calculating).toBe(false);
  });

  // ─── initialData (SSR seed) ─────────────────────────────────────
  it("con initialData siembra estado y no queda en loading", () => {
    const { result } = renderHook(() =>
      useRemittanceCalculator({
        currencies: [{ id: "c1", code: "USD", name: "USA", symbol: "$", active: true, created_at: "" }],
        paymentMethods: mockPaymentMethods as never,
        deliveryMethods: mockDeliveryMethods as never,
        exchangeRates: mockMatrix as never,
      })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.paymentMethods).toHaveLength(2);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ─── Carga inicial exitosa ──────────────────────────────────────
  it("carga métodos de pago y entrega al montar", async () => {
    mockMount();
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.paymentMethods).toEqual(mockPaymentMethods);
    expect(result.current.deliveryMethods).toEqual(mockDeliveryMethods);
    expect(result.current.error).toBeNull();
  });

  // ─── Carga inicial con error ────────────────────────────────────
  it("setea error si falla la carga de datos iniciales (sin caché)", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("No se pudieron cargar los datos. Revisa tu conexión.");
  });

  it("setea error si fetch lanza excepción (sin caché)", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("No se pudieron cargar los datos. Revisa tu conexión.");
  });

  // ─── selección ──────────────────────────────────────────────────
  it("selectPaymentMethod actualiza el método de pago seleccionado", async () => {
    mockMount();
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    act(() => result.current.selectPaymentMethod("pm-1"));
    expect(result.current.selectedPaymentMethod).toEqual(mockPaymentMethods[0]);
  });

  it("selectPaymentMethod con id inválido deja null", async () => {
    mockMount();
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    act(() => result.current.selectPaymentMethod("invalid-id"));
    expect(result.current.selectedPaymentMethod).toBeNull();
  });

  it("selectDeliveryMethod actualiza el método de entrega seleccionado", async () => {
    mockMount();
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    act(() => result.current.selectDeliveryMethod("dm-1"));
    expect(result.current.selectedDeliveryMethod).toEqual(mockDeliveryMethods[0]);
  });

  // ─── setters ────────────────────────────────────────────────────
  it("setOriginCountry / setOriginCurrency / setAmount actualizan estado", async () => {
    mockMount();
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    act(() => result.current.setOriginCountry("Estados Unidos"));
    act(() => result.current.setOriginCurrency("EUR"));
    act(() => result.current.setAmount(500));

    expect(result.current.originCountry).toBe("Estados Unidos");
    expect(result.current.originCurrency).toBe("EUR");
    expect(result.current.amount).toBe(500);
  });

  // ─── validaciones de calculate ──────────────────────────────────
  it("calculate con selecciones incompletas muestra error", async () => {
    mockMount();
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    await act(async () => { result.current.calculate(); });
    expect(result.current.error).toBe("Selecciona método de pago y método de entrega");
  });

  it("calculate sin país de origen muestra error", async () => {
    mockMount();
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    await act(async () => { result.current.calculate(); });

    expect(result.current.error).toBe("Ingresa el país de origen");
  });

  it("calculate con monto 0 o negativo muestra error", async () => {
    mockMount();
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    act(() => result.current.setOriginCountry("Estados Unidos"));
    act(() => result.current.setAmount(0));
    await act(async () => { result.current.calculate(); });

    expect(result.current.error).toBe("Ingresa un monto válido");
  });

  // ─── calculate desde la matriz (camino principal) ───────────────
  it("calculate exitoso usando la matriz en memoria (sin fetch extra)", async () => {
    mockMount(mockMatrix);
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    act(() => result.current.setOriginCountry("Estados Unidos"));
    act(() => result.current.setAmount(500));

    await act(async () => {
      result.current.calculate();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).toBeNull();
    expect(result.current.calculating).toBe(false);
    expect(result.current.result).not.toBeNull();
    expect(result.current.result!.rateMultiplier).toBe(97.5);
    expect(result.current.result!.receivingAmount).toBe(48750);
    expect(result.current.result!.originCountry).toBe("Estados Unidos");
    expect(result.current.result!.originCurrency).toBe("USD");
    expect(result.current.result!.paymentMethodName).toBe("Zelle");
    expect(result.current.result!.deliveryMethodName).toBe("Efectivo USD");
    // Solo los 4 fetches de montaje; calculate no hizo round-trip
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  // ─── calculate fallback a la API ────────────────────────────────
  it("calculate hace fallback a la API si la matriz no tiene la combinación (404)", async () => {
    mockMount([]); // matriz vacía
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "No hay tasa de cambio disponible" }),
    });

    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    act(() => result.current.setOriginCountry("Estados Unidos"));
    act(() => result.current.setAmount(500));

    await act(async () => {
      result.current.calculate();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).toBe("No hay tasa de cambio disponible");
    expect(result.current.result).toBeNull();
  });

  it("calculate maneja error de red en el fallback", async () => {
    mockMount([]);
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    act(() => result.current.setOriginCountry("Estados Unidos"));
    act(() => result.current.setAmount(500));

    await act(async () => {
      result.current.calculate();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).toBe("No hay tasa disponible para esta combinación");
    expect(result.current.result).toBeNull();
  });

  // ─── reset ──────────────────────────────────────────────────────
  it("reset limpia todas las selecciones y resultados", async () => {
    mockMount(mockMatrix);
    const { result } = renderHook(() => useRemittanceCalculator());
    await flush();

    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    act(() => result.current.setOriginCountry("Estados Unidos"));
    act(() => result.current.setAmount(500));
    await act(async () => {
      result.current.calculate();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.result).not.toBeNull();

    act(() => result.current.reset());

    expect(result.current.selectedPaymentMethod).toBeNull();
    expect(result.current.selectedDeliveryMethod).toBeNull();
    expect(result.current.originCountry).toBe("");
    expect(result.current.originCurrency).toBe("USD");
    expect(result.current.amount).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
