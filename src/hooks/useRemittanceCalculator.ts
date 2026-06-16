"use client";

import { useState, useCallback } from "react";
import { useAppData } from "@/components/AppDataProvider";
import type {
  PaymentMethod,
  DeliveryMethod,
  RemittanceResult,
} from "@/types";

/**
 * Lógica de la calculadora de remesas. Los datos (monedas, métodos y matriz
 * de tasas) vienen precargados desde el servidor vía <AppDataProvider>, así
 * que el cálculo es 100% en memoria — sin peticiones a la red.
 */
export function useRemittanceCalculator() {
  const { currencies, paymentMethods, deliveryMethods, exchangeRates } = useAppData();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod | null>(null);

  const [originCountry, setOriginCountry] = useState<string>("");
  const [originCurrency, setOriginCurrency] = useState<string>("USD");
  const [amount, setAmount] = useState<number>(0);

  const [result, setResult] = useState<RemittanceResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Métodos de pago filtrados por la moneda del país seleccionado
  const filteredPaymentMethods = useCallback((): PaymentMethod[] => {
    if (!originCurrency) return paymentMethods.filter((p) => p.active);
    if (originCurrency === "__OTHER__") return paymentMethods.filter((p) => p.active);

    const matchedCurrency = currencies.find((c) => c.code === originCurrency && c.active);
    if (!matchedCurrency) return paymentMethods.filter((p) => p.active);

    const byCurrency = paymentMethods.filter(
      (p) => p.active && (p.currency_id === matchedCurrency.id || p.currency_id === null)
    );
    const specific = byCurrency.filter((p) => p.currency_id !== null);
    return specific.length > 0 ? byCurrency : paymentMethods.filter((p) => p.active);
  }, [paymentMethods, currencies, originCurrency]);

  const calculate = useCallback(() => {
    if (!selectedPaymentMethod || !selectedDeliveryMethod) {
      setError("Selecciona método de pago y método de entrega");
      return;
    }
    if (!originCountry.trim()) {
      setError("Ingresa el país de origen");
      return;
    }
    if (amount <= 0) {
      setError("Ingresa un monto válido");
      return;
    }

    setError(null);
    setCalculating(true);

    const resolvedCurrency = (originCurrency === "__OTHER__" ? "USD" : originCurrency) || "USD";

    // Cálculo en memoria desde la matriz de tasas (sin round-trip)
    const match = exchangeRates.find(
      (r) =>
        r.paymentMethodId === selectedPaymentMethod.id &&
        r.deliveryMethodId === selectedDeliveryMethod.id
    );

    if (match) {
      setResult({
        rateMultiplier: match.rate,
        receivingAmount: amount * match.rate,
        originAmount: amount,
        originCountry,
        originCurrency: resolvedCurrency,
        paymentMethodName: selectedPaymentMethod.name,
        deliveryMethodName: selectedDeliveryMethod.name,
      });
    } else {
      setResult(null);
      setError("No hay tasa disponible para esta combinación");
    }

    setCalculating(false);
  }, [selectedPaymentMethod, selectedDeliveryMethod, originCountry, originCurrency, amount, exchangeRates]);

  const reset = useCallback(() => {
    setSelectedPaymentMethod(null);
    setSelectedDeliveryMethod(null);
    setOriginCountry("");
    setOriginCurrency("USD");
    setAmount(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    currencies,
    paymentMethods,
    deliveryMethods,
    filteredPaymentMethods,
    selectedPaymentMethod,
    selectedDeliveryMethod,
    originCountry,
    originCurrency,
    amount,
    receivingAmount: result?.receivingAmount ?? null,
    rateMultiplier: result?.rateMultiplier ?? null,
    result,
    // Datos precargados desde el servidor → nunca hay estado de carga.
    isLoading: false,
    calculating,
    error,
    selectPaymentMethod: (id: string) =>
      setSelectedPaymentMethod(paymentMethods.find((m) => m.id === id) ?? null),
    selectDeliveryMethod: (id: string) =>
      setSelectedDeliveryMethod(deliveryMethods.find((m) => m.id === id) ?? null),
    setOriginCountry,
    setOriginCurrency,
    setAmount,
    calculate,
    reset,
  };
}
