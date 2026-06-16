export function Footer({ whatsappPhone }: { whatsappPhone?: string }) {
  const waUrl = `https://wa.me/${whatsappPhone ?? "5355555555"}`;
  const enlaces = [
    { href: "#combos", label: "Combos y Productos" },
    { href: "#calcular", label: "Calcular Remesa" },
    { href: "#tasas", label: "Tasas de Cambio" },
  ];

  const servicios = [
    "Remesas Internacionales",
    "Combos Alimenticios",
    "Envíos a Cuba",
  ];

  return (
    <footer
      className="relative overflow-hidden text-white"
      role="contentinfo"
      style={{
        background: "linear-gradient(180deg, #001a0f 0%, #001208 50%, #000a05 100%)",
      }}
    >
      {/* ─── Línea superior: gradiente horizontal verde brillante 3px ─── */}
      <div
        className="h-[3px] w-full"
        style={{
          background: "linear-gradient(90deg, transparent, #006847, #00ff88, #006847, transparent)",
        }}
        aria-hidden="true"
      />

      {/* ─── Decoración: círculos blur verde oscuro en esquinas ─── */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full opacity-[0.04] blur-3xl"
        style={{ background: "radial-gradient(circle, #00ff88 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full opacity-[0.03] blur-3xl"
        style={{ background: "radial-gradient(circle, #006847 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-1/3 right-0 h-48 w-48 translate-x-1/2 rounded-full opacity-[0.02] blur-3xl"
        style={{ background: "radial-gradient(circle, #008a5e 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* ─── Contenido principal: 4 columnas ─── */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* ─── Columna 1: Logo + Descripción + WhatsApp pequeño ─── */}
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #006847, #008a5e)",
                  boxShadow: "0 2px 12px rgba(0,104,71,0.4)",
                }}
              >
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Mr <span style={{ color: "#00ff88" }}>Factus</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Remesas y combos a Cuba. Seriedad y entrega gratis.
            </p>
            {/* Botón WhatsApp pequeño */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #25D366, #1fb855)",
                boxShadow: "0 2px 8px rgba(37,211,102,0.3)",
              }}
              aria-label="Contactar por WhatsApp"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>

          {/* ─── Columna 2: Enlaces ─── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              Enlaces
            </h3>
            <ul className="mt-5 space-y-3">
              {enlaces.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 transition-all duration-200 hover:translate-x-1 hover:text-[#00ff88]"
                  >
                    <span className="text-[10px] opacity-50">→</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Columna 3: Servicios ─── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              Servicios
            </h3>
            <ul className="mt-5 space-y-3">
              {servicios.map((svc) => (
                <li key={svc} className="flex items-center gap-2.5 text-sm text-slate-400">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#006847]" aria-hidden="true" />
                  {svc}
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Columna 4: Contacto ─── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              Contacto
            </h3>
            <ul className="mt-5 space-y-4">
              <li>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-sm text-slate-400 transition-colors duration-200 hover:text-[#25D366]"
                >
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                mrfactusremesas@gmail.com
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                La Habana, Cuba
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Franja Copyright: fondo más oscuro ─── */}
        <div
          className="mt-14 -mx-4 -mb-16 px-4 py-6 sm:-mx-6 sm:-mb-20 sm:px-6 lg:py-7"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            borderTop: "1px solid rgba(0, 104, 71, 0.1)",
          }}
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-slate-500">
              © 2026 Mr Factus. Todos los derechos reservados.
            </p>
            <p className="text-xs text-slate-600">
              Remesas y Combos a Cuba • Entrega gratis
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
