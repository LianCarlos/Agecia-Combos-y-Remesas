import { getExchangeRates, calculateReceivingAmount } from "@/lib/services/exchange-rates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentMethodId = searchParams.get("paymentMethodId");
  const deliveryMethodId = searchParams.get("deliveryMethodId");
  const amount = searchParams.get("amount");

  try {
    // Si vienen todos los parámetros de cálculo, calcular monto a recibir
    if (paymentMethodId && deliveryMethodId && amount) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return Response.json({ error: "El monto debe ser un número positivo" }, { status: 400 });
      }

      const result = await calculateReceivingAmount({ paymentMethodId, deliveryMethodId, amount: parsedAmount });
      if (!result) {
        return Response.json({ error: "No hay tasa de cambio disponible" }, { status: 404 });
      }

      return Response.json({
        rate: result.rate,
        receivingAmount: result.receivingAmount,
        paymentMethodName: result.paymentMethodName,
        deliveryMethodName: result.deliveryMethodName,
      });
    }

    // Si no, devolver todas las tasas activas
    const rates = await getExchangeRates();
    return Response.json(rates);
  } catch (error) {
    return Response.json({ error: "Error al cargar tasas de cambio" }, { status: 500 });
  }
}
