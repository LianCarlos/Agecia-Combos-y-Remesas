/* ═══════════════════════════════════════════════════════════════════════════
   SMOOTH SCROLL · Animación de scroll con easing propio (requestAnimationFrame)
   ───────────────────────────────────────────────────────────────────────────
   No usamos `behavior: "smooth"` del navegador: su curva/velocidad no se pueden
   controlar Y, además, el navegador lo desactiva (salto instantáneo) cuando el
   sistema tiene "Reducir movimiento" activado. Aquí escribimos `scrollTop` del
   elemento que realmente scrollea, frame a frame: eso NO lo anima el navegador,
   NO lo afecta el CSS `scroll-behavior` ni la preferencia de reduce-motion, así
   que tenemos control total. Curva: arranca medio rápido y aterriza suave.
   ═══════════════════════════════════════════════════════════════════════════ */

// Alto aproximado del header sticky + un respiro, para no tapar la sección.
export const HEADER_OFFSET = 72;

// easeOutQuart: rápido al inicio, desaceleración marcada al final.
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

// El elemento que scrollea la página (html en modo estándar; body en quirks).
function getScroller(): HTMLElement {
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

// Cancelador de la animación en curso (si se dispara otra o el usuario scrollea).
let cancelCurrent: (() => void) | null = null;

/** Anima el scroll vertical hasta `targetY` (px desde el tope del documento). */
export function smoothScrollToY(targetY: number): void {
  if (typeof window === "undefined") return;

  // Cancela cualquier animación previa para que no se peleen.
  cancelCurrent?.();

  const scroller = getScroller();
  const startY = scroller.scrollTop;
  const maxY = scroller.scrollHeight - scroller.clientHeight;
  const destY = Math.max(0, Math.min(targetY, maxY));
  const distance = destY - startY;

  // Ya estamos prácticamente ahí: posiciona y listo.
  if (Math.abs(distance) < 2) {
    scroller.scrollTop = destY;
    return;
  }

  // Duración proporcional a la distancia: medio rápida, con piso y techo.
  const duration = Math.min(780, Math.max(420, Math.abs(distance) * 0.5));

  let rafId = 0;
  let startTime: number | null = null;

  const onUserScroll = () => stop();
  function removeUserListeners() {
    window.removeEventListener("wheel", onUserScroll);
    window.removeEventListener("touchmove", onUserScroll);
    window.removeEventListener("keydown", onUserScroll);
  }
  function stop() {
    cancelAnimationFrame(rafId);
    removeUserListeners();
    cancelCurrent = null;
  }

  // Si el usuario interactúa (rueda/arrastre/teclado) abortamos para no forcejear.
  window.addEventListener("wheel", onUserScroll, { passive: true });
  window.addEventListener("touchmove", onUserScroll, { passive: true });
  window.addEventListener("keydown", onUserScroll);
  cancelCurrent = stop;

  function frame(now: number) {
    if (startTime === null) startTime = now;
    const t = Math.min(1, (now - startTime) / duration);
    scroller.scrollTop = startY + distance * easeOutQuart(t);
    if (t < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      removeUserListeners();
      cancelCurrent = null;
    }
  }
  rafId = requestAnimationFrame(frame);
}

/** Anima el scroll hasta el elemento con `id`, dejando el offset del header. */
export function smoothScrollToId(id: string, offset: number = HEADER_OFFSET): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const scroller = getScroller();
  const targetY = el.getBoundingClientRect().top + scroller.scrollTop - offset;
  smoothScrollToY(targetY);
  return true;
}
