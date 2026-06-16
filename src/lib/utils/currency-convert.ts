import type { RateInfo } from "@/types";

/**
 * Convierte un precio en USD a la moneda del método de pago seleccionado,
 * usando la matriz de tasas disponible. Devuelve null si no hay forma de
 * convertir (se mostrará el precio en USD como fallback).
 *
 * Lógica:
 *  - Si el método de pago opera en USD → no convierte.
 *  - Si existe una tasa con entrega en USD → divide por esa tasa.
 *  - Si solo hay tasa en CUP → usa la tasa USD→CUP de referencia como puente.
 */
export function convertToPaymentCurrency(
  priceUSD: number,
  pmId: string,
  rates: RateInfo[]
): { amount: number; code: string; symbol: string } | null {
  const pmRates = rates.filter((r) => r.paymentMethodId === pmId);
  if (!pmRates.length) return null;

  const { currencyCode, currencySymbol } = pmRates[0];
  if (currencyCode === "USD") return { amount: priceUSD, code: "USD", symbol: "$" };

  const usdDel = pmRates.find((r) => r.deliveryMethod.toLowerCase().includes("usd"));
  if (usdDel?.rate) return { amount: priceUSD / usdDel.rate, code: currencyCode, symbol: currencySymbol };

  const myCup = pmRates.find((r) => r.deliveryMethod.toLowerCase().includes("cup"));
  if (!myCup) return null;

  const usdRef = rates
    .filter((r) => r.currencyCode === "USD")
    .find((r) => r.deliveryMethodId === myCup.deliveryMethodId);
  if (!usdRef?.rate) return null;

  return { amount: priceUSD * (usdRef.rate / myCup.rate), code: currencyCode, symbol: currencySymbol };
}
