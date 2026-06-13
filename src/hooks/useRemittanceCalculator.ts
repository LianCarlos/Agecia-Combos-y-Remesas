"use client";

import { useState, useEffect, useCallback } from "react";
import type { PaymentMethod, DeliveryMethod, RemittanceResult, Currency } from "@/types";

export function useRemittanceCalculator() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod | null>(null);

  const [originCountry, setOriginCountry] = useState<string>("");
  const [originCurrency, setOriginCurrency] = useState<string>("USD");
  const [amount, setAmount] = useState<number>(0);

  const [result, setResult] = useState<RemittanceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setIsLoading(true);
      setError(null);
      try {
        const [pmRes, dmRes, curRes] = await Promise.all([
          fetch("/api/payment-methods"),
          fetch("/api/delivery-methods"),
          fetch("/api/countries"),
        ]);

        if (cancelled) return;
        if (!pmRes.ok || !dmRes.ok) {
          setError("Error al cargar datos iniciales");
          return;
        }

        const pm: PaymentMethod[] = await pmRes.json();
        const dm: DeliveryMethod[] = await dmRes.json();
        const cur: Currency[] = curRes.ok ? await curRes.json() : [];

        if (!cancelled) {
          setPaymentMethods(pm);
          setDeliveryMethods(dm);
          setCurrencies(cur);
        }
      } catch {
        if (!cancelled) setError("Error al cargar datos iniciales");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadInitialData();
    return () => { cancelled = true; };
  }, []);

  // Métodos de pago filtrados por la moneda del país seleccionado
  const filteredPaymentMethods = useCallback((): PaymentMethod[] => {
    if (!originCurrency) return paymentMethods.filter(p => p.active);

    // User typed a custom/unknown country → show ALL methods
    if (originCurrency === "__OTHER__") return paymentMethods.filter(p => p.active);

    // Buscar si la moneda existe en la lista configurada
    const matchedCurrency = currencies.find(c => c.code === originCurrency && c.active);
    if (!matchedCurrency) {
      // País no en la lista → mostrar TODOS los métodos activos
      return paymentMethods.filter(p => p.active);
    }

    // Filtrar por currency_id; si un método no tiene currency_id, lo incluimos (aplica a todos)
    const byCurrency = paymentMethods.filter(
      p => p.active && (p.currency_id === matchedCurrency.id || p.currency_id === null)
    );
    // Si ningún método tiene esa moneda específica, mostrar todos (fallback)
    const specific = byCurrency.filter(p => p.currency_id !== null);
    return specific.length > 0 ? byCurrency : paymentMethods.filter(p => p.active);
  }, [paymentMethods, currencies, originCurrency]);

  const calculate = useCallback(async () => {
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

    try {
      const params = new URLSearchParams({
        paymentMethodId: selectedPaymentMethod.id,
        deliveryMethodId: selectedDeliveryMethod.id,
        amount: amount.toString(),
      });

      const res = await fetch(`/api/exchange-rates?${params.toString()}`);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "No hay tasa disponible para esta combinación");
        setResult(null);
        return;
      }

      const data = await res.json();

      // Map API response → RemittanceResult
      setResult({
        rateMultiplier: data.rate ?? data.rateMultiplier ?? 0,
        receivingAmount: data.receivingAmount,
        originAmount: amount,
        originCountry,
        originCurrency: (originCurrency === "__OTHER__" ? "USD" : originCurrency) || "USD",
        paymentMethodName: data.paymentMethodName,
        deliveryMethodName: data.deliveryMethodName,
      });
    } catch {
      setError("Error al calcular la tasa de cambio");
      setResult(null);
    } finally {
      setCalculating(false);
    }
  }, [selectedPaymentMethod, selectedDeliveryMethod, originCountry, originCurrency, amount]);

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
    isLoading,
    calculating,
    error,
    selectPaymentMethod: (id: string) =>
      setSelectedPaymentMethod(paymentMethods.find(m => m.id === id) ?? null),
    selectDeliveryMethod: (id: string) =>
      setSelectedDeliveryMethod(deliveryMethods.find(m => m.id === id) ?? null),
    setOriginCountry,
    setOriginCurrency,
    setAmount,
    calculate,
    reset,
  };
}
