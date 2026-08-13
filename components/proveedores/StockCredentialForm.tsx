"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { addStock } from "@/lib/actions/provider.actions";

export function StockCredentialForm({
  productId,
  productType = "STOCK",
}: {
  productId: string;
  productType?: "STOCK" | "ACTIVACION";
}) {
  const router = useRouter();
  const isActivacion = productType === "ACTIVACION";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await addStock({
      productId,
      username,
      password: isActivacion ? undefined : password,
      extraInfo: extraInfo || undefined,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setUsername("");
    setPassword("");
    setExtraInfo("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Input
        label={isActivacion ? "Correo" : "Usuario / correo"}
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="sm:w-56"
      />
      {!isActivacion && (
        <Input
          label="Contraseña"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="sm:w-44"
        />
      )}
      <Input
        label={isActivacion ? "PIN" : "Notas (opcional)"}
        required={isActivacion}
        value={extraInfo}
        onChange={(e) => setExtraInfo(e.target.value)}
        placeholder={isActivacion ? "PIN de la cuenta" : "PIN, perfil, etc."}
        className="sm:w-44"
      />
      <Button type="submit" isLoading={loading} className="sm:w-auto">
        Agregar
      </Button>
      {error && <p className="text-sm text-danger sm:ml-2">{error}</p>}
    </form>
  );
}
