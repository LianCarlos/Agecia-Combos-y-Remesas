import type { CalculatorData, Currency, PaymentMethod, DeliveryMethod } from "@/types";

/**
 * Datos de respaldo para cuando la base de datos no responde.
 * Permiten que la calculadora y los selectores se muestren (degradados)
 * en lugar de quedar en blanco. Las tasas reales no están disponibles
 * sin BD, así que el cálculo mostrará "tasa no disponible" hasta reconectar.
 */

export const FALLBACK_CURRENCIES: Currency[] = [
  { id: "fb-usd", code: "USD", name: "Estados Unidos", symbol: "$", active: true, created_at: "" },
  { id: "fb-eur", code: "EUR", name: "Europa", symbol: "€", active: true, created_at: "" },
  { id: "fb-mxn", code: "MXN", name: "México", symbol: "$", active: true, created_at: "" },
];

export const FALLBACK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "fb-zelle", name: "Zelle", active: true, currency_id: null, created_at: "", currencies: null },
  { id: "fb-transfer", name: "Transferencia", active: true, currency_id: null, created_at: "", currencies: null },
  { id: "fb-cash", name: "Efectivo", active: true, currency_id: null, created_at: "", currencies: null },
];

export const FALLBACK_DELIVERY_METHODS: DeliveryMethod[] = [
  { id: "fb-cup-cash", name: "CUP-Efectivo", active: true, type: "cash", created_at: "" },
  { id: "fb-cup-transfer", name: "CUP-Transferencia", active: true, type: "transfer", created_at: "" },
  { id: "fb-usd-cash", name: "USD-Efectivo", active: true, type: "cash", created_at: "" },
];

export const FALLBACK_CALCULATOR_DATA: CalculatorData = {
  currencies: FALLBACK_CURRENCIES,
  paymentMethods: FALLBACK_PAYMENT_METHODS,
  deliveryMethods: FALLBACK_DELIVERY_METHODS,
  exchangeRates: [],
};
