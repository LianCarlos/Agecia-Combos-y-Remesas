/**
 * Formato de tasa coherente en todo el sitio (ticker, calculadora, checkout).
 * - Factores < 1 (p. ej. USD→USD 0.90) se muestran como "×0.900".
 * - Tasas ≥ 1 se muestran con hasta 2 decimales, sin ceros de relleno:
 *   63.05 → "63.05", 45.6 → "45.6", 72 → "72".
 * Antes se redondeaba a entero cuando la tasa era ≥ 10, anunciando una tasa
 * distinta a la que realmente se aplicaba.
 */
export function formatRate(rate: number): string {
  if (!Number.isFinite(rate)) return "—";
  if (rate < 1) return `×${rate.toFixed(3)}`;
  return trimZeros(rate.toFixed(2));
}

function trimZeros(s: string): string {
  return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

/**
 * Tiempo relativo tolerante: devuelve "—" ante fechas vacías o inválidas
 * (evita el "NaNd" que aparecía cuando no había ninguna tasa que fechar).
 */
export function relativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const ts = new Date(isoDate).getTime();
  if (!Number.isFinite(ts)) return "—";
  const diffMin = Math.floor((Date.now() - ts) / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  return `${Math.floor(diffHrs / 24)}d`;
}
