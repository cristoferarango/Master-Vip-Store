import { PanelBackground } from "@/components/shared/PanelBackground";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/ui/Badge";

export default function VipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PanelBackground variant="vip" />
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <Badge tone="primary" className="hidden sm:inline-flex">
            Panel VIP
          </Badge>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
