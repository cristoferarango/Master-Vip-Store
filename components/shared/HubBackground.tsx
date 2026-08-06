import { EnergyField } from "./EnergyField";
import { FloatingParticles } from "./FloatingParticles";

/** Fondo de la página raíz: grilla técnica sutil + campo de energía en canvas + partículas. */
export function HubBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(220,38,38,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(220,38,38,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 100%)",
        }}
      />
      <EnergyField className="absolute inset-0" />
      <FloatingParticles />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(0,0,0,0.6),transparent_70%)]" />
    </div>
  );
}
