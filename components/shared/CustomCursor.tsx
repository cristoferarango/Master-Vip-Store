"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor personalizado: una estela de chispas —igual estética que las
 * partículas del fondo EnergyField— formada por una cadena de puntos, cada
 * uno persiguiendo al anterior con su propio retraso. Como cada punto tiene
 * su propia fase, al girar rápido la cadena traza una curva real (no una
 * barra rígida rotando). Sin canvas ni lecturas de layout por cuadro, para
 * que sea robusto. Solo se activa con mouse real (pointer: fine) y si el
 * usuario no pidió reducir animaciones — en celular/touch no hace nada.
 */

const CHAIN_LENGTH = 14;

export function CustomCursor() {
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const canUseCustomCursor =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canUseCustomCursor) return;

    document.documentElement.classList.add("mvs-cursor-none");

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const points = Array.from({ length: CHAIN_LENGTH }, () => ({ x: target.x, y: target.y }));
    let rafId = 0;
    let hidden = true;
    let hover = false;

    function setVisible(v: boolean) {
      dotRefs.current.forEach((el) => el?.style.setProperty("opacity", v ? "1" : "0"));
    }

    function onMove(e: MouseEvent) {
      target.x = e.clientX;
      target.y = e.clientY;
      if (hidden) {
        hidden = false;
        setVisible(true);
      }
    }
    function onLeave() {
      hidden = true;
      setVisible(false);
    }

    function isTextField(el: Element | null): boolean {
      return !!el?.closest('input, textarea, select, [contenteditable="true"]');
    }
    function isInteractive(el: Element | null): boolean {
      return !!el?.closest('a, button, [role="button"], .cursor-hover');
    }

    function onOver(e: MouseEvent) {
      const el = e.target as Element | null;
      if (isTextField(el)) {
        setVisible(false);
      } else {
        hover = isInteractive(el);
        if (!hidden) setVisible(true);
      }
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    function tick() {
      points[0].x += (target.x - points[0].x) * 0.42;
      points[0].y += (target.y - points[0].y) * 0.42;
      for (let i = 1; i < CHAIN_LENGTH; i++) {
        const ease = Math.max(0.34 - i * 0.015, 0.12);
        points[i].x += (points[i - 1].x - points[i].x) * ease;
        points[i].y += (points[i - 1].y - points[i].y) * ease;
      }

      const hoverScale = hover ? 1.6 : 1;
      for (let i = 0; i < CHAIN_LENGTH; i++) {
        const el = dotRefs.current[i];
        if (!el) continue;
        const p = points[i];
        const t = i / (CHAIN_LENGTH - 1); // 0 = cabeza, 1 = cola
        const size = Math.max((i === 0 ? 8 : 6) * (1 - t) + 1, 1) * (i === 0 ? hoverScale : 1);

        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        const g = Math.round(210 * (1 - t));
        const alpha = Math.max(0.85 * (1 - t) + 0.06, 0);
        el.style.background = `radial-gradient(circle, rgba(255,255,255,${alpha}) 0%, rgba(239,${g},${g},${alpha}) 55%, transparent 100%)`;
      }

      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove("mvs-cursor-none");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999]">
      {Array.from({ length: CHAIN_LENGTH }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            dotRefs.current[i] = el;
          }}
          className="mvs-cursor-dot fixed left-0 top-0 rounded-full opacity-0"
          style={{ willChange: "transform, width, height" }}
        />
      ))}
    </div>
  );
}
