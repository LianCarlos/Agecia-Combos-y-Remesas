import { getActiveCombos } from "@/lib/services/combos";

export async function GET() {
  try {
    const combos = await getActiveCombos();
    return Response.json(combos);
  } catch (error) {
    return Response.json(
      { error: "Error al cargar combos" },
      { status: 500 }
    );
  }
}
