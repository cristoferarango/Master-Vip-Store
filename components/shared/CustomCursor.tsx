"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor personalizado: un meteorito con cola larga y curva.
 *
 * La cola es una cadena de puntos con física real (cada uno persigue al
 * anterior con su propio retraso — igual que las chispas del fondo), pero
 * en vez de dibujar cada punto como un círculo suelto (eso se ve como
 * "puntos que lo siguen"), se dibuja el SEGMENTO entre cada par de puntos
 * consecutivos como una barra corta rotada que los conecta — así no hay
 * huecos y se lee como una sola cola continua que se curva de verdad
 * cuando el mouse cambia de dirección (no una barra rígida rotando).
 * Color: blanco brillante en la cabeza (el calor de la fricción) que se
 * apaga a rojo hacia la punta de la cola, como un meteorito calentándose.
 * Sin canvas (se descartó antes por inestable) — todo con transforms de
 * DOM. Solo con mouse real (pointer: fine) y sin "reducir movimiento".
 */

const CHAIN_LENGTH = 17; // más puntos = cola más larga

function mixWhiteToRed(t: number): string {
  const r = Math.round(255 - 16 * t);
  const g = Math.round(255 - 187 * t);
  const b = Math.round(255 - 187 * t);
  return `${r},${g},${b}`;
}

export function CustomCursor() {
  const headRef = useRef<HTMLDivElement | null>(null);
  const haloRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      const op = v ? "1" : "0";
      headRef.current?.style.setProperty("opacity", op);
      haloRef.current?.style.setProperty("opacity", op);
      segmentRefs.current.forEach((el) => el?.style.setProperty("opacity", op));
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
      // Cadena: cada punto persigue al anterior con su propio retraso — así
      // la cola se curva de verdad al cambiar de dirección, en vez de girar
      // como una barra rígida.
      points[0].x += (target.x - points[0].x) * 0.4;
      points[0].y += (target.y - points[0].y) * 0.4;
      for (let i = 1; i < CHAIN_LENGTH; i++) {
        const ease = Math.max(0.36 - i * 0.014, 0.1);
        points[i].x += (points[i - 1].x - points[i].x) * ease;
        points[i].y += (points[i - 1].y - points[i].y) * ease;
      }

      const hoverScale = hover ? 1.7 : 1;
      const headSize = 9 * hoverScale;

      const headEl = headRef.current;
      const haloEl = haloRef.current;
      if (headEl) {
        headEl.style.transform = `translate3d(${points[0].x}px, ${points[0].y}px, 0) translate(-50%, -50%)`;
        headEl.style.width = `${headSize}px`;
        headEl.style.height = `${headSize}px`;
      }
      if (haloEl) {
        const haloSize = 30 * hoverScale;
        haloEl.style.transform = `translate3d(${points[0].x}px, ${points[0].y}px, 0) translate(-50%, -50%)`;
        haloEl.style.width = `${haloSize}px`;
        haloEl.style.height = `${haloSize}px`;
      }

      // Un segmento por cada par de puntos consecutivos — conecta la cadena
      // sin huecos y cada uno lleva su propio color/ángulo/largo.
      for (let i = 0; i < CHAIN_LENGTH - 1; i++) {
        const el = segmentRefs.current[i];
        if (!el) continue;
        const from = points[i];
        const to = points[i + 1];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy) + 1; // +1 evita huecos por redondeo entre segmentos
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        const t = i / (CHAIN_LENGTH - 2); // 0 = junto a la cabeza, 1 = punta de la cola
        const thickness = Math.max(6 * (1 - t) + 1, 1);
        const opacity = Math.max(0.95 * (1 - Math.pow(t, 1.5)), 0);

        el.style.transform = `translate3d(${from.x}px, ${from.y}px, 0) rotate(${angle}deg)`;
        el.style.width = `${length}px`;
        el.style.height = `${thickness}px`;
        el.style.marginTop = `${-thickness / 2}px`;
        el.style.opacity = `${opacity}`;
        el.style.background = `rgb(${mixWhiteToRed(t)})`;
        el.style.boxShadow = `0 0 ${4 + thickness}px rgba(${mixWhiteToRed(Math.min(t + 0.15, 1))},${opacity * 0.8})`;
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
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999] mix-blend-screen">
      {/* Halo: bloom suave detrás de la cabeza, le da el "brillo" de meteorito. */}
      <div
        ref={haloRef}
        className="fixed left-0 top-0 rounded-full opacity-0 blur-md"
        style={{
          willChange: "transform, width, height",
          background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(239,68,68,0.55) 45%, transparent 75%)",
        }}
      />
      {/*
        Segmentos de la cola: cada `div` conecta dos puntos consecutivos de
        la cadena. `left:0` + `transformOrigin: "0% 50%"` anclan el borde
        IZQUIERDO del segmento (su punto de partida) en el punto de la
        cadena — así translate3d lo planta ahí y el segmento se dibuja hacia
        el siguiente punto, sin el desfase que da usar solo el ancho/alto.
      */}
      {Array.from({ length: CHAIN_LENGTH - 1 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            segmentRefs.current[i] = el;
          }}
          className="fixed left-0 top-0 opacity-0 blur-[0.5px]"
          style={{
            borderRadius: 999,
            transformOrigin: "0% 50%",
            willChange: "transform, width, height, opacity, background, box-shadow",
          }}
        />
      ))}
      {/* Cabeza: núcleo brillante y nítido. */}
      <div
        ref={headRef}
        className="fixed left-0 top-0 rounded-full opacity-0"
        style={{
          willChange: "transform, width, height",
          background: "radial-gradient(circle, #ffffff 0%, #ffb4b4 45%, #ef4444 100%)",
          boxShadow: "0 0 6px 1px rgba(255,255,255,0.9), 0 0 16px 4px rgba(239,68,68,0.7)",
        }}
      />
    </div>
  );
}
