"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { buildRecoveryWhatsappLink } from "@/lib/utils/whatsapp";

/**
 * No hay recuperación automática por correo (no hay envío de emails en el
 * proyecto) — en vez de eso, arma un WhatsApp pre-llenado directo al dueño
 * con el correo y usuario que la persona escribe acá. El dueño verifica la
 * cuenta y le pone una contraseña nueva desde Panel Master → Usuarios.
 */
export function PasswordRecoveryForm({ ownerWhatsapp }: { ownerWhatsapp: string | null }) {
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [username, setUsername] = useState("");

  if (!ownerWhatsapp) {
    return <p className="text-sm text-danger">El soporte no está disponible en este momento. Intenta más tarde.</p>;
  }

  const ready = recoveryEmail.trim().length > 0 && username.trim().length > 0;
  const link = buildRecoveryWhatsappLink({ whatsapp: ownerWhatsapp, recoveryEmail, username });

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Correo con el que te registraste"
        type="email"
        required
        value={recoveryEmail}
        onChange={(e) => setRecoveryEmail(e.target.value)}
        placeholder="tucorreo@ejemplo.com"
      />
      <Input
        label="Tu nombre de usuario"
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="tu_usuario"
      />
      <a
        href={ready ? link : undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!ready}
        onClick={(e) => {
          if (!ready) e.preventDefault();
        }}
        className={`press-feedback flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition-[filter] ${
          ready
            ? "bg-gradient-to-r from-primary to-primary-strong text-primary-foreground shadow-primary/25 hover:brightness-110"
            : "cursor-not-allowed bg-surface-strong text-muted-foreground shadow-none"
        }`}
      >
        <MessageCircle size={16} /> Enviar solicitud por WhatsApp
      </a>
      <p className="text-xs text-muted-foreground">
        Te vamos a verificar por WhatsApp con esos datos antes de cambiarte la contraseña.
      </p>
    </div>
  );
}
