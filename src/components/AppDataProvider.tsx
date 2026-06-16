"use client";

import { createContext, useContext, useMemo } from "react";
import type {
  CalculatorData,
  Currency,
  PaymentMethod,
  DeliveryMethod,
  RateDisplay,
  PMInfo,
  RateInfo,
} from "@/types";

/**
 * Datos públicos del sitio (calculadora + tasas) precargados en el servidor
 * y entregados al cliente UNA sola vez vía Context. Elimina los `fetch("/api/...")`
 * que hacían los componentes cliente al montar (calculadora, modal de recargas),
 * que era la fuente real de la lentitud percibida.
 */
interface AppDataValue extends CalculatorData {
  /** Métodos de pago activos reducidos para los selectores de los catálogos. */
  paymentMethodsInfo: PMInfo[];
  /** Matriz de tasas reducida para convertir USD → moneda del método de pago. */
  rates: RateInfo[];
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData debe usarse dentro de <AppDataProvider>");
  return ctx;
}

/** Métodos de pago activos → forma reducida PMInfo (selectores de catálogos). */
export function toPaymentMethodsInfo(paymentMethods: PaymentMethod[]): PMInfo[] {
  return paymentMethods
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      name: p.name,
      active: p.active,
      currencies: p.currencies ? { code: p.currencies.code, symbol: p.currencies.symbol } : null,
    }));
}

/** Matriz de tasas (display) → forma reducida RateInfo para conversión de precios. */
export function toRateInfo(exchangeRates: RateDisplay[]): RateInfo[] {
  return exchangeRates.map((r) => ({
    paymentMethodId: r.paymentMethodId,
    deliveryMethodId: r.deliveryMethodId,
    deliveryMethod: r.deliveryMethod,
    currencyCode: r.currencyCode,
    currencySymbol: r.currencySymbol,
    rate: r.rate,
  }));
}

export function AppDataProvider({
  data,
  children,
}: {
  data: CalculatorData;
  children: React.ReactNode;
}) {
  const value = useMemo<AppDataValue>(() => {
    const currencies: Currency[] = data.currencies ?? [];
    const paymentMethods: PaymentMethod[] = data.paymentMethods ?? [];
    const deliveryMethods: DeliveryMethod[] = data.deliveryMethods ?? [];
    const exchangeRates: RateDisplay[] = data.exchangeRates ?? [];
    return {
      currencies,
      paymentMethods,
      deliveryMethods,
      exchangeRates,
      paymentMethodsInfo: toPaymentMethodsInfo(paymentMethods),
      rates: toRateInfo(exchangeRates),
    };
  }, [data]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
