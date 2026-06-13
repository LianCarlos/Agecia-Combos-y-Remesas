import { getActiveDeliveryMethods } from "@/lib/services/delivery-methods";

export async function GET() {
  try {
    const methods = await getActiveDeliveryMethods();
    return Response.json(methods);
  } catch (error) {
    return Response.json(
      { error: "Error al cargar métodos de entrega" },
      { status: 500 }
    );
  }
}
