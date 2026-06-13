import { getExchangeRates, calculateReceivingAmount } from "../exchange-rates";
import type { RateDisplay } from "@/types";

// ─── Mock del cliente Supabase server ─────────────────────────────
const mockSelectChain = {
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
};

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => ({
        select: jest.fn(() => mockSelectChain),
      })),
    })
  ),
}));

describe("getExchangeRates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna array de RateDisplay cuando hay datos válidos", async () => {
    mockSelectChain.order.mockResolvedValueOnce({
      data: [
        {
          payment_method_id: "pm-1",
          delivery_method_id: "dm-1",
          rate: 97.5,
          updated_at: "2026-06-02T14:30:00Z",
          payment_methods: { id: "pm-1", name: "Zelle", active: true, currency_id: "c-1", currencies: { id: "c-1", code: "USD", symbol: "$" } },
          delivery_methods: { id: "dm-1", name: "Efectivo USD", active: true },
        },
        {
          payment_method_id: "pm-2",
          delivery_method_id: "dm-2",
          rate: 95.0,
          updated_at: "2026-06-02T10:00:00Z",
          payment_methods: { id: "pm-2", name: "Western Union", active: true, currency_id: "c-2", currencies: { id: "c-2", code: "EUR", symbol: "€" } },
          delivery_methods: { id: "dm-2", name: "Transferencia Bancaria", active: true },
        },
      ],
      error: null,
    });

    const result = await getExchangeRates();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("retorna la estructura RateDisplay correcta", async () => {
    mockSelectChain.order.mockResolvedValueOnce({
      data: [
        {
          payment_method_id: "pm-1",
          delivery_method_id: "dm-1",
          rate: 97.5,
          updated_at: "2026-06-02T14:30:00Z",
          payment_methods: { id: "pm-1", name: "Zelle", active: true, currency_id: "c-1", currencies: { id: "c-1", code: "USD", symbol: "$" } },
          delivery_methods: { id: "dm-1", name: "Efectivo USD", active: true },
        },
      ],
      error: null,
    });

    const result = await getExchangeRates();
    const rate: RateDisplay = result[0];

    expect(rate).toHaveProperty("paymentMethodId", "pm-1");
    expect(rate).toHaveProperty("deliveryMethodId", "dm-1");
    expect(rate).toHaveProperty("paymentMethod", "Zelle");
    expect(rate).toHaveProperty("deliveryMethod", "Efectivo USD");
    expect(rate).toHaveProperty("currencyCode", "USD");
    expect(rate).toHaveProperty("currencySymbol", "$");
    expect(rate).toHaveProperty("rate", 97.5);
    expect(rate).toHaveProperty("updatedAt");
  });

  it("usa valores por defecto cuando faltan datos anidados", async () => {
    mockSelectChain.order.mockResolvedValueOnce({
      data: [
        {
          payment_method_id: "pm-3",
          delivery_method_id: "dm-3",
          rate: 90.0,
          updated_at: "2026-06-01T00:00:00Z",
          payment_methods: null,
          delivery_methods: null,
        },
      ],
      error: null,
    });

    const result = await getExchangeRates();

    expect(result[0].paymentMethod).toBe("Desconocido");
    expect(result[0].deliveryMethod).toBe("Desconocido");
    expect(result[0].currencyCode).toBe("USD");
    expect(result[0].currencySymbol).toBe("$");
  });

  it("retorna array vacío cuando hay error de Supabase", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSelectChain.order.mockResolvedValueOnce({
      data: null,
      error: { message: "Database error" },
    });

    const result = await getExchangeRates();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
    consoleSpy.mockRestore();
  });
});

describe("calculateReceivingAmount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna null para combinación inexistente", async () => {
    mockSelectChain.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await calculateReceivingAmount({
      paymentMethodId: "pm-nonexistent",
      deliveryMethodId: "dm-nonexistent",
      amount: 500,
    });

    expect(result).toBeNull();
  });

  it("retorna resultado correcto para combinación válida", async () => {
    mockSelectChain.maybeSingle.mockResolvedValueOnce({
      data: {
        rate: 97.5,
        payment_methods: { name: "Zelle" },
        delivery_methods: { name: "Efectivo USD" },
      },
      error: null,
    });

    const result = await calculateReceivingAmount({
      paymentMethodId: "pm-1",
      deliveryMethodId: "dm-1",
      amount: 500,
    });

    expect(result).not.toBeNull();
    expect(result!.rate).toBe(97.5);
    expect(result!.receivingAmount).toBe(500 * 97.5);
    expect(result!.paymentMethodName).toBe("Zelle");
    expect(result!.deliveryMethodName).toBe("Efectivo USD");
  });

  it("retorna null cuando Supabase devuelve error", async () => {
    mockSelectChain.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Error de conexión" },
    });

    const result = await calculateReceivingAmount({
      paymentMethodId: "pm-1",
      deliveryMethodId: "dm-1",
      amount: 500,
    });

    expect(result).toBeNull();
  });
});
