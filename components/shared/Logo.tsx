import Link from "next/link";
import { Gem } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong bg-gradient-to-br from-primary to-accent-2 text-white">
        <Gem size={16} strokeWidth={1.75} />
      </span>
      <span className="text-lg tracking-tight text-foreground">
        Master <span className="text-gradient">Vip Store</span>
      </span>
    </Link>
  );
}
