"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

export function RegisterForm({
  kind,
  redirectTo,
  successNote,
}: {
  kind: "cliente" | "proveedor";
  redirectTo: string;
  successNote?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [referredByCode, setReferredByCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name,
          username,
          businessName: kind === "proveedor" ? businessName : undefined,
          email,
          whatsapp,
          password,
          referredByCode: referredByCode || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo completar el registro");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nombre completo" required value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        label="Nombre de usuario"
        required
        placeholder="tu_nick"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        label="Código de referido (opcional)"
        placeholder="MVS-XXXXXX"
        value={referredByCode}
        onChange={(e) => setReferredByCode(e.target.value)}
      />
      {kind === "proveedor" && (
        <Input
          label="Nombre de tu tienda/negocio"
          required
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
      )}
      <Input
        label="Correo electrónico"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Número de celular (WhatsApp)"
        required
        placeholder="9XXXXXXXX"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        Solo números de Perú (9 dígitos). Lo usamos para avisarte sobre tus pagos y compras.
      </p>
      <PasswordInput
        label="Contraseña"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      {successNote && <p className="text-xs text-muted-foreground">{successNote}</p>}
      <Button type="submit" isLoading={loading} className="mt-2">
        Crear cuenta
      </Button>
    </form>
  );
}
