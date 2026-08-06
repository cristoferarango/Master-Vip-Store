import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export interface HubCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel: string;
  shimmerDelay?: number;
}

// Estilo único (rojo ceniza sobre negro) para las 3 tarjetas del home —
// antes cada una tenía un acento distinto, pero se unificaron a este.
const STYLE = {
  ring: "rgba(127,29,29,0.6)",
  glow: "rgba(127,29,29,0.2)",
  iconBg: "rgba(127,29,29,0.22)",
  iconFg: "#f5f5f5",
  button: "linear-gradient(135deg, #450a0a, var(--primary))",
  buttonText: "#ffffff",
} as const;

export function HubCard({
  href,
  icon: Icon,
  title,
  description,
  buttonLabel,
  shimmerDelay = 0,
}: HubCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-border p-8 text-center transition-transform duration-300 hover:-translate-y-1.5 hover:border-[var(--card-ring)]"
      style={
        {
          "--card-ring": STYLE.ring,
          background: `radial-gradient(120% 90% at 50% 0%, ${STYLE.glow}, transparent 60%), var(--background-elevated)`,
        } as React.CSSProperties
      }
    >
      <span
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{ background: STYLE.iconBg, color: STYLE.iconFg, borderColor: STYLE.ring }}
      >
        <Icon size={26} strokeWidth={1.75} />
      </span>

      <h2 className="mb-3 text-3xl font-extrabold uppercase tracking-tight text-foreground">{title}</h2>

      <p className="mb-8 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <span
        className="shimmer flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition-transform group-hover:scale-[1.02]"
        style={{ background: STYLE.button, color: STYLE.buttonText, "--shimmer-delay": `${shimmerDelay}s` } as React.CSSProperties}
      >
        {buttonLabel}
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
