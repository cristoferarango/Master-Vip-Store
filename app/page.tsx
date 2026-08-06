import { MonitorPlay, BriefcaseBusiness, Crown } from "lucide-react";
import { HubBackground } from "@/components/shared/HubBackground";
import { HubCard } from "@/components/shared/HubCard";

export default function RootPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20 sm:px-6">
      <HubBackground />

      <div className="mb-14 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          MASTER <span className="text-gradient">VIP STORE</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">¿Qué quieres hacer hoy?</p>
      </div>

      <div className="grid w-full max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <HubCard
          href="/streaming"
          icon={MonitorPlay}
          title="Streaming"
          description="Netflix, HBO Max, Canva, ChatGPT y más. Compra cuentas al instante."
          buttonLabel="Entrar a la tienda"
          shimmerDelay={0}
        />
        <HubCard
          href="/proveedores"
          icon={BriefcaseBusiness}
          title="Proveedores"
          description="Publica tus cuentas, gestiona tu stock y controla tus ventas y ganancias."
          buttonLabel="Acceso proveedores"
          shimmerDelay={1.2}
        />
        <HubCard
          href="/vip"
          icon={Crown}
          title="Master"
          description="Control del panel Master Vip Store."
          buttonLabel="Acceso VIP"
          shimmerDelay={2.4}
        />
      </div>
    </div>
  );
}
