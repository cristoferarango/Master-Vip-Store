"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

type Capability = "any" | "provider" | "admin";

export function LoginForm({
  requiredCapability,
  redirectTo,
  mismatchMessage,
}: {
  /** "any" = cualquier cuenta logueada (Streaming). "provider" = necesita perfil de proveedor. "admin" = necesita isAdmin. */
  requiredCapability: Capability;
  redirectTo: string;
  mismatchMessage?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión");
        return;
      }

      const hasCapability =
        requiredCapability === "any" ||
        (requiredCapability === "admin" && data.isAdmin) ||
        (requiredCapability === "provider" && data.hasProvider);

      if (!hasCapability) {
        await fetch("/api/auth/logout", { method: "POST" });
        setError(mismatchMessage ?? "Esta cuenta no tiene acceso a este panel.");
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
      <Input
        label="Correo electrónico"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tucorreo@ejemplo.com"
      />
      <PasswordInput
        label="Contraseña"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" isLoading={loading} className="mt-2">
        Iniciar sesión
      </Button>
    </form>
  );
}
