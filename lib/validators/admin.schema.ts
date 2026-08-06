import { z } from "zod";

// El admin puede editar correo/whatsapp y opcionalmente resetear la
// contraseña de cualquier cuenta (usuario o proveedor).
export const updateAccountSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{6,20}$/, "Ingresa un número de WhatsApp válido"),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional().or(z.literal("")),
});
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
