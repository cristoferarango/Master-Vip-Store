import { EnergyField, type EnergyFieldProps } from "./EnergyField";
import { FloatingParticles } from "./FloatingParticles";

const VARIANTS: Record<"streaming" | "proveedores" | "vip", EnergyFieldProps> = {
  streaming: { anchorY: 0.3, particleCount: 90, intensity: 0.9 },
  proveedores: { anchorY: 0.24, particleCount: 80, intensity: 0.85 },
  vip: { anchorY: 0.26, particleCount: 85, intensity: 1 },
};

/**
 * Fondo compartido de los 3 paneles internos — misma familia visual que el
 * home (EnergyField + partículas), cada uno con una variante sutil para no
 * ser 100% idéntico. Fixed, detrás del contenido, con grilla técnica tenue.
 */
export function PanelBackground({ variant }: { variant: keyof typeof VARIANTS }) {
  const props = VARIANTS[variant];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(220,38,38,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(220,38,38,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 100%)",
        }}
      />
      <EnergyField className="absolute inset-0" {...props} />
      <FloatingParticles />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(0,0,0,0.65),transparent_70%)]" />
    </div>
  );
}
