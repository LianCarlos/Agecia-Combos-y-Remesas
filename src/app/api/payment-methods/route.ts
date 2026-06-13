import { getActivePaymentMethods } from "@/lib/services/payment-methods";

export async function GET() {
  try {
    const methods = await getActivePaymentMethods();
    return Response.json(methods);
  } catch (error) {
    return Response.json(
      { error: "Error al cargar métodos de pago" },
      { status: 500 }
    );
  }
}
