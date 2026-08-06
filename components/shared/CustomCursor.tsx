"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor personalizado inmersivo: reemplaza el puntero nativo por un
 * "meteorito" — cabeza brillante con una estela que se alarga según la
 * velocidad del mouse (igual que las partículas del fondo EnergyField),
 * más unas chispas de escombros detrás. Sobre elementos interactivos se
 * convierte en un aro de "objetivo". Solo se activa con mouse real
 * (pointer: fine) y si el usuario no pidió reducir animaciones — en
 * cualquier otro caso (celular, tablet, touch) no hace nada y se usa el
 * comportamiento nativo normal, porque un cursor que sigue al mouse no
 * tiene sentido en pantallas táctiles.
 */

const EMBER_COUNT = 4;

export function CustomCursor() {
  const coreRef = useRef<HTMLDivElement>(null);
  const emberRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const canUseCustomCursor =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canUseCustomCursor) return;

    document.documentElement.classList.add("mvs-cursor-none");

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const head = { x: target.x, y: target.y };
    const embers = Array.from({ length: EMBER_COUNT }, () => ({ x: target.x, y: target.y }));
    let rafId = 0;
    let hidden = true;
    let currentAngle = 0;

    function onMove(e: MouseEvent) {
      target.x = e.clientX;
      target.y = e.clientY;
      if (hidden) {
        hidden = false;
        coreRef.current?.style.setProperty("opacity", "1");
      }
    }

    function onLeave() {
      hidden = true;
      coreRef.current?.style.setProperty("opacity", "0");
      emberRefs.current.forEach((el) => el?.style.setProperty("opacity", "0"));
    }

    function isTextField(el: Element | null): boolean {
      if (!el) return false;
      return !!el.closest('input, textarea, select, [contenteditable="true"]');
    }

    function isInteractive(el: Element | null): boolean {
      if (!el) return false;
      return !!el.closest('a, button, [role="button"], .cursor-hover');
    }

    function onOver(e: MouseEvent) {
      const el = e.target as Element | null;
      const core = coreRef.current;
      if (!core) return;

      if (isTextField(el)) {
        core.style.setProperty("opacity", "0");
      } else if (isInteractive(el)) {
        core.dataset.hover = "true";
        core.style.setProperty("opacity", "1");
      } else {
        core.dataset.hover = "false";
        if (!hidden) core.style.setProperty("opacity", "1");
      }
    }

    function onDown() {
      coreRef.current?.setAttribute("data-press", "true");
    }
    function onUp() {
      coreRef.current?.setAttribute("data-press", "false");
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    function tick() {
      const dx = target.x - head.x;
      const dy = target.y - head.y;
      head.x += dx * 0.35;
      head.y += dy * 0.35;

      const dist = Math.sqrt(dx * dx + dy * dy);

      // Suaviza el giro por el camino más corto en vez de saltar de golpe a
      // la nueva dirección — así el meteorito "curva" al cambiar de rumbo
      // en lugar de pivotar como un palito rígido.
      if (dist > 0.6) {
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        let diff = targetAngle - currentAngle;
        diff = ((diff + 180) % 360 + 360) % 360 - 180;
        currentAngle += diff * 0.16;
      }
      const stretch = Math.min(1 + dist * 0.1, 6);

      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${head.x}px, ${head.y}px, 0) translate(-50%, -50%) rotate(${currentAngle}deg) scaleX(${stretch})`;
      }

      let prevX = head.x;
      let prevY = head.y;
      for (let i = 0; i < EMBER_COUNT; i++) {
        const p = embers[i];
        const ease = 0.24 - i * 0.03;
        p.x += (prevX - p.x) * Math.max(ease, 0.09);
        p.y += (prevY - p.y) * Math.max(ease, 0.09);
        const el = emberRefs.current[i];
        if (el) {
          const scale = 1 - i / (EMBER_COUNT + 1);
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scale(${scale})`;
          el.style.opacity = hidden ? "0" : String(scale * 0.55);
        }
        prevX = p.x;
        prevY = p.y;
      }

      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove("mvs-cursor-none");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999]">
      {Array.from({ length: EMBER_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            emberRefs.current[i] = el;
          }}
          className="fixed left-0 top-0 h-1 w-1 rounded-full opacity-0 blur-[0.5px]"
          style={{ background: "var(--primary-strong)", willChange: "transform" }}
        />
      ))}
      <div
        ref={coreRef}
        data-hover="false"
        data-press="false"
        className="mvs-cursor-core fixed left-0 top-0 opacity-0"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
