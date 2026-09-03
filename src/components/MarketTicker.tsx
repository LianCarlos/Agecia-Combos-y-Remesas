import { getExchangeRates } from "@/lib/services/exchange-rates";
import { getActiveWholesaleRates } from "@/lib/services/wholesale-rates";
import { formatRate, relativeTime } from "@/lib/utils/format";
import type { WholesaleRate } from "@/types";

/* ─── Currency Code → Flag Map ─── */

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  MXN: "🇲🇽",
  CAD: "🇨🇦",
  CLP: "🇨🇱",
  ARS: "🇦🇷",
  BRL: "🇧🇷",
  COP: "🇨🇴",
  PEN: "🇵🇪",
  GBP: "🇬🇧",
  BOB: "🇧🇴",
  PYG: "🇵🇾",
  UYU: "🇺🇾",
  CZK: "🇨🇿",
  CHF: "🇨🇭",
};

function getFlag(currencyCode: string): string {
  return CURRENCY_FLAGS[currencyCode.toUpperCase()] ?? "🌎";
}

/* ═══════════════════════════════════════════════════════════════════════════
   RATE PANEL · Bloomberg Terminal Style
   Panel lateral derecho — fondo negro-verdoso, tipografía mono,
   efecto scanline, dot pulsante verde, tasas en #00ff88
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Wholesale Rate grouping helper ─── */
function groupByPM(rates: WholesaleRate[]): { pmName: string; tiers: WholesaleRate[] }[] {
  const map = new Map<string, WholesaleRate[]>();
  for (const r of rates) {
    const key = r.payment_methods?.name ?? "Otro";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries()).map(([pmName, tiers]) => ({ pmName, tiers }));
}

export async function MarketTicker() {
  const rates = await getExchangeRates();

  // Sin tasas normales no se renderiza este panel (las mayoristas tienen el
  // suyo propio en <WholesaleTicker>). Evita el "0 PARES · ACTUALIZADO —".
  if (rates.length === 0) return null;

  return (
    <aside
      aria-label="Panel de tasas de cambio en tiempo real"
      className="card-rate scanline-overlay w-full overflow-hidden"
    >
      {/* ─── Header: MERCADO EN VIVO + dot verde pulsante ─── */}
      <div className="flex items-center justify-between border-b border-green-900/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="live-dot" aria-hidden="true" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[#00ff88]">
            MERCADO EN VIVO
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-green-700/40">
          FX
        </span>
      </div>

      {/* ─── Filas de tasas con fade edges ─── */}
      <div className="relative max-h-[480px] overflow-y-auto scrollbar-hide">
        {/* Degradado superior — fade edge */}
        <div
          className="pointer-events-none sticky top-0 z-10 h-6"
          style={{
            background: "linear-gradient(180deg, #0a1a0f 0%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        <div className="divide-y divide-green-900/30">
          {rates.map((r) => (
            <div
              key={`${r.paymentMethodId}:${r.deliveryMethodId}`}
              className="flex items-center gap-2 px-4 py-2.5 font-mono text-xs transition-colors hover:bg-[#00ff88]/[0.03]"
            >
              {/* Bandera + código moneda */}
              <span className="text-sm" aria-hidden="true">
                {getFlag(r.currencyCode)}
              </span>
              <div className="w-[3.5rem] shrink-0">
                <span className="block text-[11px] font-semibold text-slate-300 leading-none">
                  {r.paymentMethod.length > 6 ? r.paymentMethod.slice(0, 6) : r.paymentMethod}
                </span>
                <span className="block text-[9px] text-green-700/40 leading-none mt-0.5">
                  {r.currencyCode.toUpperCase()}
                </span>
              </div>

              {/* Flecha → */}
              <span
                className="text-[10px] text-green-700/40"
                aria-hidden="true"
              >
                →
              </span>

              {/* Método de entrega */}
              <span className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
                {r.deliveryMethod}
              </span>

              {/* TASA en verde brillante — formato coherente en todo el sitio */}
              <span className="text-sm font-bold tracking-tight text-[#00ff88]">
                {formatRate(r.rate)}
              </span>

              {/* Hora relativa en gris tenue */}
              <span className="w-10 text-right text-[10px] text-slate-600">
                {relativeTime(r.updatedAt)}
              </span>
            </div>
          ))}
        </div>

        {/* Degradado inferior — fade edge */}
        <div
          className="pointer-events-none sticky bottom-0 z-10 h-6"
          style={{
            background: "linear-gradient(0deg, #0a1a0f 0%, transparent 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* ─── Footer: conteo + última actualización ─── */}
      <div className="border-t border-green-900/30 px-4 py-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-green-700/25">
          {rates.length} PARES · ACTUALIZADO{" "}
          {relativeTime(rates[0]?.updatedAt ?? "")}
        </span>
      </div>

      {/* ─── Línea decorativa inferior con gradiente verde ─── */}
      <div
        className="h-[1px] w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,255,136,0.3), rgba(0,255,136,0.3), transparent)",
        }}
        aria-hidden="true"
      />
    </aside>
  );
}

/* ─── Panel de tasas mayoristas (Bloomberg style) ─── */

export async function WholesaleTicker() {
  const wholesaleRates = await getActiveWholesaleRates().catch(() => [] as WholesaleRate[]);
  if (wholesaleRates.length === 0) return null;

  const groups = groupByPM(wholesaleRates);

  return (
    <aside
      aria-label="Tasas mayoristas para envíos grandes"
      className="card-rate scanline-overlay w-full overflow-hidden mt-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-green-900/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[#00ff88] text-xs" aria-hidden="true">◈</span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[#00ff88]">
            ENVÍOS MAYORISTAS
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-green-700/40">
          BULK
        </span>
      </div>

      {/* Subtitle */}
      <div className="border-b border-green-900/20 px-4 py-2">
        <p className="font-mono text-[9px] uppercase tracking-wider text-green-700/40">
          Mientras más envías, mejor tasa recibes
        </p>
      </div>

      {/* Groups by payment method */}
      <div className="divide-y divide-green-900/20">
        {groups.map(({ pmName, tiers }) => (
          <div key={pmName}>
            {/* PM header row */}
            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#00ff88]/[0.03]">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-green-600/60">
                {pmName}
              </span>
            </div>
            {/* Tiers */}
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center gap-2 px-4 py-2 font-mono text-xs transition-colors hover:bg-[#00ff88]/[0.03]"
              >
                <span className="text-[10px] text-green-700/50" aria-hidden="true">+</span>
                <span className="w-20 shrink-0 text-[11px] font-semibold text-slate-300">
                  ${tier.min_amount >= 1000
                    ? `${(tier.min_amount / 1000).toFixed(tier.min_amount % 1000 === 0 ? 0 : 1)}k`
                    : tier.min_amount.toFixed(0)}
                </span>
                <span className="text-[10px] text-green-700/40" aria-hidden="true">───────</span>
                <span className="ml-auto text-sm font-bold tracking-tight text-[#00ff88]">
                  {formatRate(tier.rate)}
                </span>
                <span className="text-[9px] text-green-700/40">CUP</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-green-900/30 px-4 py-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-green-700/25">
          Tasas preferenciales · Consultar disponibilidad
        </span>
      </div>

      <div
        className="h-[1px] w-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.3), rgba(0,255,136,0.3), transparent)" }}
        aria-hidden="true"
      />
    </aside>
  );
}

/* ─── Versión mobile: placeholder (no se renderiza en mobile) ─── */

export function MarketTickerMobile() {
  return null;
}

