/**
 * Tests para useRemittanceCalculator hook
 * Capa 2 — Hook (mockea fetch, no toca Supabase)
 *
 * Nueva API: paymentMethods, deliveryMethods, selectedPaymentMethod,
 * selectedDeliveryMethod, originCountry (string), originCurrency (string),
 * amount, isLoading, calculating, error, calculate, reset.
 */

// ─── Mocks de fetch global ────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Imports ──────────────────────────────────────────────────────
import { renderHook, act } from "@testing-library/react";
import { useRemittanceCalculator } from "../useRemittanceCalculator";

// ─── Fixtures ─────────────────────────────────────────────────────
const mockPaymentMethods = [
  { id: "pm-1", name: "Zelle", active: true, currency_id: null, created_at: "2026-01-01" },
  { id: "pm-2", name: "Western Union", active: true, currency_id: null, created_at: "2026-01-01" },
];

const mockDeliveryMethods = [
  { id: "dm-1", name: "Efectivo USD", active: true, created_at: "2026-01-01" },
  { id: "dm-2", name: "Transferencia Bancaria", active: true, created_at: "2026-01-01" },
];

const mockExchangeResult = {
  rateMultiplier: 97.5,
  receivingAmount: 48750,
  originCountry: "Estados Unidos",
  originCurrency: "USD",
  paymentMethodName: "Zelle",
  deliveryMethodName: "Efectivo USD",
};

describe("useRemittanceCalculator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Estado inicial ─────────────────────────────────────────────

  it("estado inicial: isLoading=true, sin selecciones, sin error", () => {
    // Fetch nunca resuelve para mantener isLoading=true
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

  // ─── Carga inicial exitosa ──────────────────────────────────────

  it("carga métodos de pago y entrega al montar", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentMethods,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeliveryMethods,
      })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.paymentMethods).toEqual(mockPaymentMethods);
    expect(result.current.deliveryMethods).toEqual(mockDeliveryMethods);
    expect(result.current.error).toBeNull();
  });

  // ─── Carga inicial con error ────────────────────────────────────

  it("setea error si falla la carga de datos iniciales", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Error al cargar datos iniciales");
  });

  it("setea error si fetch lanza excepción", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Error al cargar datos iniciales");
  });

  // ─── selectPaymentMethod ────────────────────────────────────────

  it("selectPaymentMethod actualiza el método de pago seleccionado", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.selectPaymentMethod("pm-1");
    });

    expect(result.current.selectedPaymentMethod).toEqual(mockPaymentMethods[0]);
  });

  it("selectPaymentMethod con id inválido deja null", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.selectPaymentMethod("invalid-id");
    });

    expect(result.current.selectedPaymentMethod).toBeNull();
  });

  // ─── selectDeliveryMethod ───────────────────────────────────────

  it("selectDeliveryMethod actualiza el método de entrega seleccionado", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.selectDeliveryMethod("dm-1");
    });

    expect(result.current.selectedDeliveryMethod).toEqual(mockDeliveryMethods[0]);
  });

  // ─── setOriginCountry / setOriginCurrency / setAmount ───────────

  it("setOriginCountry actualiza el país de origen", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.setOriginCountry("Estados Unidos");
    });

    expect(result.current.originCountry).toBe("Estados Unidos");
  });

  it("setOriginCurrency actualiza la moneda", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.setOriginCurrency("EUR");
    });

    expect(result.current.originCurrency).toBe("EUR");
  });

  it("setAmount actualiza el monto", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.setAmount(500);
    });

    expect(result.current.amount).toBe(500);
  });

  // ─── calculate ──────────────────────────────────────────────────

  it("calculate con selecciones incompletas muestra error", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      result.current.calculate();
    });

    expect(result.current.error).toBe(
      "Selecciona método de pago y método de entrega"
    );
  });

  it("calculate sin país de origen muestra error", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.selectPaymentMethod("pm-1");
    });
    act(() => {
      result.current.selectDeliveryMethod("dm-1");
    });

    await act(async () => {
      result.current.calculate();
    });

    expect(result.current.error).toBe("Ingresa el país de origen");
  });

  it("calculate con monto 0 muestra error", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.selectPaymentMethod("pm-1");
    });
    act(() => {
      result.current.selectDeliveryMethod("dm-1");
    });
    act(() => {
      result.current.setOriginCountry("Estados Unidos");
    });
    act(() => {
      result.current.setAmount(0);
    });

    await act(async () => {
      result.current.calculate();
    });

    expect(result.current.error).toBe("Ingresa un monto válido");
  });

  it("calculate con monto negativo muestra error", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.selectPaymentMethod("pm-1");
    });
    act(() => {
      result.current.selectDeliveryMethod("dm-1");
    });
    act(() => {
      result.current.setOriginCountry("Estados Unidos");
    });
    act(() => {
      result.current.setAmount(-50);
    });

    await act(async () => {
      result.current.calculate();
    });

    expect(result.current.error).toBe("Ingresa un monto válido");
  });

  it("calculate exitoso retorna resultado correcto", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      // El fetch de calculate
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockExchangeResult,
      });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.selectPaymentMethod("pm-1");
    });
    act(() => {
      result.current.selectDeliveryMethod("dm-1");
    });
    act(() => {
      result.current.setOriginCountry("Estados Unidos");
    });
    act(() => {
      result.current.setAmount(500);
    });

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
  });

  it("calculate muestra error si el API retorna 404 (sin tasa)", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "No hay tasa de cambio disponible para esta combinación" }),
      });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.selectPaymentMethod("pm-1");
    });
    act(() => {
      result.current.selectDeliveryMethod("dm-1");
    });
    act(() => {
      result.current.setOriginCountry("Estados Unidos");
    });
    act(() => {
      result.current.setAmount(500);
    });

    await act(async () => {
      result.current.calculate();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).toBe(
      "No hay tasa de cambio disponible para esta combinación"
    );
    expect(result.current.result).toBeNull();
  });

  it("calculate maneja error de red", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.selectPaymentMethod("pm-1");
    });
    act(() => {
      result.current.selectDeliveryMethod("dm-1");
    });
    act(() => {
      result.current.setOriginCountry("Estados Unidos");
    });
    act(() => {
      result.current.setAmount(500);
    });

    await act(async () => {
      result.current.calculate();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).toBe("Error al calcular la tasa de cambio");
    expect(result.current.result).toBeNull();
  });

  // ─── reset ──────────────────────────────────────────────────────

  it("reset limpia todas las selecciones y resultados", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockPaymentMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => mockDeliveryMethods })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockExchangeResult });

    const { result } = renderHook(() => useRemittanceCalculator());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    act(() => {
      result.current.selectPaymentMethod("pm-1");
    });
    act(() => {
      result.current.selectDeliveryMethod("dm-1");
    });
    act(() => {
      result.current.setOriginCountry("Estados Unidos");
    });
    act(() => {
      result.current.setAmount(500);
    });

    await act(async () => {
      result.current.calculate();
      await new Promise((r) => setTimeout(r, 0));
    });

    // Confirmar que hay resultado
    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedPaymentMethod).toBeNull();
    expect(result.current.selectedDeliveryMethod).toBeNull();
    expect(result.current.originCountry).toBe("");
    expect(result.current.originCurrency).toBe("USD");
    expect(result.current.amount).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

