/**
 * Tests para useRemittanceCalculator.
 *
 * Arquitectura actual: el hook no hace fetch; lee monedas, métodos y la matriz
 * de tasas desde <AppDataProvider> (sembrado en el servidor). El cálculo es en
 * memoria: receivingAmount = amount * rate de la combinación (pago, entrega).
 */

import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { AppDataProvider } from "@/components/AppDataProvider";
import { useRemittanceCalculator } from "../useRemittanceCalculator";
import type { CalculatorData } from "@/types";

const data: CalculatorData = {
  currencies: [
    { id: "c1", code: "USD", name: "Estados Unidos", symbol: "$", active: true, created_at: "" },
  ],
  paymentMethods: [
    { id: "pm-1", name: "Zelle", active: true, currency_id: "c1", created_at: "", currencies: { id: "c1", code: "USD", name: "Estados Unidos", symbol: "$", active: true, created_at: "" } },
    { id: "pm-2", name: "Western Union", active: true, currency_id: "c1", created_at: "" },
  ],
  deliveryMethods: [
    { id: "dm-1", name: "Efectivo USD", active: true, type: "cash", created_at: "" },
    { id: "dm-2", name: "Transferencia", active: true, type: "transfer", created_at: "" },
  ],
  exchangeRates: [
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
  ],
};

function wrapper({ children }: { children: ReactNode }) {
  return <AppDataProvider data={data}>{children}</AppDataProvider>;
}

function setup() {
  return renderHook(() => useRemittanceCalculator(), { wrapper });
}

describe("useRemittanceCalculator", () => {
  it("estado inicial: sin selecciones, sin loading, sin error", () => {
    const { result } = setup();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.selectedPaymentMethod).toBeNull();
    expect(result.current.selectedDeliveryMethod).toBeNull();
    expect(result.current.originCountry).toBe("");
    expect(result.current.originCurrency).toBe("USD");
    expect(result.current.amount).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("expone métodos de pago y entrega desde el contexto", () => {
    const { result } = setup();
    expect(result.current.paymentMethods).toHaveLength(2);
    expect(result.current.deliveryMethods).toHaveLength(2);
  });

  it("selectPaymentMethod / selectDeliveryMethod actualizan la selección", () => {
    const { result } = setup();
    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    expect(result.current.selectedPaymentMethod?.name).toBe("Zelle");
    expect(result.current.selectedDeliveryMethod?.name).toBe("Efectivo USD");
  });

  it("selectPaymentMethod con id inválido deja null", () => {
    const { result } = setup();
    act(() => result.current.selectPaymentMethod("nope"));
    expect(result.current.selectedPaymentMethod).toBeNull();
  });

  it("setters actualizan país, moneda y monto", () => {
    const { result } = setup();
    act(() => result.current.setOriginCountry("México"));
    act(() => result.current.setOriginCurrency("MXN"));
    act(() => result.current.setAmount(500));
    expect(result.current.originCountry).toBe("México");
    expect(result.current.originCurrency).toBe("MXN");
    expect(result.current.amount).toBe(500);
  });

  it("calculate sin selecciones muestra error", () => {
    const { result } = setup();
    act(() => result.current.calculate());
    expect(result.current.error).toBe("Selecciona método de pago y método de entrega");
  });

  it("calculate sin país muestra error", () => {
    const { result } = setup();
    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    act(() => result.current.calculate());
    expect(result.current.error).toBe("Ingresa el país de origen");
  });

  it("calculate con monto 0 muestra error", () => {
    const { result } = setup();
    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    act(() => result.current.setOriginCountry("Estados Unidos"));
    act(() => result.current.calculate());
    expect(result.current.error).toBe("Ingresa un monto válido");
  });

  it("calculate exitoso: receivingAmount = amount * rate", () => {
    const { result } = setup();
    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    act(() => result.current.setOriginCountry("Estados Unidos"));
    act(() => result.current.setAmount(500));
    act(() => result.current.calculate());

    expect(result.current.error).toBeNull();
    expect(result.current.result).not.toBeNull();
    expect(result.current.result!.rateMultiplier).toBe(97.5);
    expect(result.current.result!.receivingAmount).toBe(48750);
    expect(result.current.result!.paymentMethodName).toBe("Zelle");
    expect(result.current.result!.deliveryMethodName).toBe("Efectivo USD");
  });

  it("calculate sin tasa para la combinación muestra error", () => {
    const { result } = setup();
    act(() => result.current.selectPaymentMethod("pm-2")); // sin tasa en la matriz
    act(() => result.current.selectDeliveryMethod("dm-2"));
    act(() => result.current.setOriginCountry("Estados Unidos"));
    act(() => result.current.setAmount(500));
    act(() => result.current.calculate());

    expect(result.current.error).toBe("No hay tasa disponible para esta combinación");
    expect(result.current.result).toBeNull();
  });

  it("reset limpia selecciones y resultado", () => {
    const { result } = setup();
    act(() => result.current.selectPaymentMethod("pm-1"));
    act(() => result.current.selectDeliveryMethod("dm-1"));
    act(() => result.current.setOriginCountry("Estados Unidos"));
    act(() => result.current.setAmount(500));
    act(() => result.current.calculate());
    expect(result.current.result).not.toBeNull();

    act(() => result.current.reset());
    expect(result.current.selectedPaymentMethod).toBeNull();
    expect(result.current.selectedDeliveryMethod).toBeNull();
    expect(result.current.originCountry).toBe("");
    expect(result.current.amount).toBe(0);
    expect(result.current.result).toBeNull();
  });
});
