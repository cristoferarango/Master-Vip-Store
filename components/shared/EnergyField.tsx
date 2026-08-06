"use client";

import { useEffect, useRef } from "react";

/**
 * Fondo animado en canvas 2D — partículas que fluyen en espiral hacia un
 * núcleo central dejando estelas de luz, inspirado en el espíritu de
 * "matrix-sentinels" (estelas fluidas) y "singularity" (convergencia
 * gravitacional) de MisterPrada, reinterpretado en rojo/blanco sobre negro
 * con canvas 2D — sin WebGPU/shaders, para que corra en cualquier navegador
 * y sea liviano en una tienda real.
 *
 * Acepta variables (particleCount/anchorY/intensity) para reutilizarse con
 * variantes sutiles en cada panel (home, streaming, proveedores, vip) sin
 * duplicar el efecto.
 */

interface Particle {
  x: number;
  y: number;
  angle: number;
  radius: number;
  speed: number;
  size: number;
  spark: boolean;
  hue: number;
}

function createParticle(cx: number, cy: number, maxRadius: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const radius = maxRadius * (0.35 + Math.random() * 0.65);
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
    angle,
    radius,
    speed: 0.0016 + Math.random() * 0.0022,
    size: Math.random() < 0.12 ? 2.2 + Math.random() * 1.4 : 0.8 + Math.random() * 1.3,
    spark: Math.random() < 0.12,
    hue: Math.random(),
  };
}

export interface EnergyFieldProps {
  className?: string;
  /** Cantidad de partículas simultáneas. */
  particleCount?: number;
  /** Posición vertical del núcleo, como fracción de la altura (0 = arriba, 1 = abajo). */
  anchorY?: number;
  /** Multiplicador de intensidad del brillo del núcleo/partículas (1 = normal). */
  intensity?: number;
}

export function EnergyField({ className, particleCount = 110, anchorY = 0.42, intensity = 1 }: EnergyFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let maxRadius = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];
    let rafId = 0;

    function resize() {
      if (!canvas) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      cx = width / 2;
      cy = height * anchorY;
      maxRadius = Math.max(width, height) * 0.6;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: particleCount }, () => createParticle(cx, cy, maxRadius));
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, width, height);
      const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.5);
      glow.addColorStop(0, `rgba(220,38,38,${0.18 * intensity})`);
      glow.addColorStop(1, "rgba(3,3,3,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, width, height);
    }

    function tick() {
      ctx!.fillStyle = "rgba(3,3,3,0.16)";
      ctx!.fillRect(0, 0, width, height);

      // Núcleo central
      const core = ctx!.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.22);
      core.addColorStop(0, `rgba(239,68,68,${0.22 * intensity})`);
      core.addColorStop(1, "rgba(3,3,3,0)");
      ctx!.fillStyle = core;
      ctx!.fillRect(0, 0, width, height);

      ctx!.globalCompositeOperation = "lighter";

      for (const p of particles) {
        // Espiral hacia el centro: el radio decrece mientras el ángulo avanza.
        p.angle += p.speed;
        p.radius -= p.speed * maxRadius * 0.42;

        if (p.radius < maxRadius * 0.05) {
          const fresh = createParticle(cx, cy, maxRadius);
          Object.assign(p, fresh);
          continue;
        }

        p.x = cx + Math.cos(p.angle) * p.radius;
        p.y = cy + Math.sin(p.angle) * p.radius * 0.62; // aplanado elíptico

        const proximity = 1 - p.radius / maxRadius;
        const alpha = (0.25 + proximity * 0.55) * intensity;
        const color = p.spark ? `rgba(255,255,255,${alpha})` : `rgba(${220 + Math.round(p.hue * 20)},${38 + Math.round(p.hue * 40)},${38},${alpha})`;

        ctx!.beginPath();
        ctx!.fillStyle = color;
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalCompositeOperation = "source-over";
      rafId = requestAnimationFrame(tick);
    }

    resize();
    if (reduceMotion) {
      drawStatic();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    const onResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      resize();
      if (reduceMotion) drawStatic();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [particleCount, anchorY, intensity]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ width: "100%", height: "100%" }} />;
}
