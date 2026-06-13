import { isAdmin } from "@/lib/auth";
import { type NextRequest } from "next/server";

/**
 * La tabla countries ya no existe.
 * Los países se gestionan a través de exchange_rates.
 * Este endpoint retorna 410 Gone.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return Response.json(
    { error: "Este endpoint ya no está disponible. Usa /api/admin/exchange-rates" },
    { status: 410 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return Response.json(
    { error: "Este endpoint ya no está disponible. Usa /api/admin/exchange-rates" },
    { status: 410 }
  );
}
