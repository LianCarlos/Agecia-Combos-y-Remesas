import { getExchangeRates } from "@/lib/services/exchange-rates";

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

/* ─── Relative Time Helper ─── */

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RATE PANEL · Bloomberg Terminal Style
   Panel lateral derecho — fondo negro-verdoso, tipografía mono,
   efecto scanline, dot pulsante verde, tasas en #00ff88
   ═══════════════════════════════════════════════════════════════════════════ */

export async function MarketTicker() {
  const rates = await getExchangeRates();

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

              {/* TASA en verde brillante — formato inteligente */}
              <span className="text-sm font-bold tracking-tight text-[#00ff88]">
                {r.rate >= 10
                  ? r.rate.toFixed(0)
                  : r.rate >= 1
                    ? r.rate.toFixed(2)
                    : `×${r.rate.toFixed(3)}`}
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

/* ─── Versión mobile: placeholder (no se renderiza en mobile) ─── */

export function MarketTickerMobile() {
  return null;
}

