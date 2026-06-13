import { getActiveCountries } from "@/lib/services/countries";

export async function GET() {
  try {
    const countries = await getActiveCountries();
    return Response.json(countries);
  } catch (error) {
    return Response.json({ error: "Error al cargar países" }, { status: 500 });
  }
}
