"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { updateUserAccount, toggleProviderStatus, deleteUserAccount } from "@/lib/actions/admin.actions";
import type { ProviderStatus } from "@prisma/client";

export function EditProviderButton({
  userId,
  providerId,
  initialEmail,
  initialWhatsapp,
  status,
}: {
  userId: string;
  providerId: string;
  initialEmail: string;
  initialWhatsapp: string;
  status: ProviderStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState<"save" | "status" | "delete" | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading("save");
    const result = await updateUserAccount(userId, { email, whatsapp, newPassword: newPassword || undefined });
    setLoading(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setNewPassword("");
    router.refresh();
  }

  async function handleStatus(newStatus: ProviderStatus) {
    setError(null);
    setLoading("status");
    const result = await toggleProviderStatus(providerId, newStatus);
    setLoading(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar esta cuenta de proveedor por completo? Esta acción no se puede deshacer.")) return;
    setError(null);
    setLoading("delete");
    const result = await deleteUserAccount(userId);
    setLoading(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Editar
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar proveedor">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input label="Correo electrónico" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="WhatsApp" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          <PasswordInput
            label="Nueva contraseña (opcional)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Dejar en blanco para no cambiarla"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-success">Cambios guardados.</p>}
          <Button type="submit" isLoading={loading === "save"}>
            Guardar cambios
          </Button>
        </form>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Estado de la cuenta</p>
            <div className="flex gap-1.5">
              {status !== "ACTIVO" && (
                <Button size="sm" variant="secondary" onClick={() => handleStatus("ACTIVO")} isLoading={loading === "status"}>
                  Activar
                </Button>
              )}
              {status !== "SUSPENDIDO" && (
                <Button size="sm" variant="danger" onClick={() => handleStatus("SUSPENDIDO")} isLoading={loading === "status"}>
                  Suspender
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Eliminar cuenta</p>
              <p className="text-xs text-muted-foreground">Falla si tiene ventas en el historial.</p>
            </div>
            <Button size="sm" variant="danger" onClick={handleDelete} isLoading={loading === "delete"}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
