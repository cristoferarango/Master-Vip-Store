// Valores fijos (no Math.random()) para que el render del servidor y el del
// cliente coincidan exactamente — evita errores de hidratación.
const PARTICLES = [
  { left: "6%", size: 3, duration: 16, delay: -2, drift: 18, opacity: 0.55 },
  { left: "14%", size: 2, duration: 13, delay: -7, drift: -14, opacity: 0.45 },
  { left: "23%", size: 4, duration: 19, delay: -4, drift: 10, opacity: 0.6 },
  { left: "31%", size: 2, duration: 15, delay: -11, drift: -20, opacity: 0.4 },
  { left: "40%", size: 3, duration: 21, delay: -1, drift: 16, opacity: 0.5 },
  { left: "48%", size: 2, duration: 12, delay: -9, drift: -8, opacity: 0.45 },
  { left: "57%", size: 4, duration: 18, delay: -6, drift: 22, opacity: 0.55 },
  { left: "65%", size: 2, duration: 14, delay: -13, drift: -16, opacity: 0.4 },
  { left: "73%", size: 3, duration: 20, delay: -3, drift: 12, opacity: 0.6 },
  { left: "81%", size: 2, duration: 16, delay: -8, drift: -10, opacity: 0.45 },
  { left: "89%", size: 4, duration: 17, delay: -5, drift: 20, opacity: 0.5 },
  { left: "95%", size: 2, duration: 13, delay: -10, drift: -18, opacity: 0.4 },
  { left: "10%", size: 2, duration: 22, delay: -14, drift: 8, opacity: 0.35 },
  { left: "77%", size: 3, duration: 15, delay: -12, drift: -12, opacity: 0.5 },
] as const;

/** Puntos de luz flotando lentamente hacia arriba, decorativo. Respeta prefers-reduced-motion (ver globals.css). */
export function FloatingParticles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--particle-drift-x": `${p.drift}px`,
              "--particle-opacity": p.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
