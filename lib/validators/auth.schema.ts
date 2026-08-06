import { z } from "zod";

// El número de WhatsApp es obligatorio en todo registro de cliente o
// proveedor (se usa para notificaciones). Acepta dígitos, espacios, + y -.
const whatsappRegex = /^[0-9+\s-]{6,20}$/;

export const registerClientSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  whatsapp: z
    .string()
    .trim()
    .regex(whatsappRegex, "Ingresa un número de WhatsApp válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});
export type RegisterClientInput = z.infer<typeof registerClientSchema>;

export const registerProviderSchema = registerClientSchema.extend({
  businessName: z.string().trim().min(2, "El nombre del negocio es muy corto").max(80),
});
export type RegisterProviderInput = z.infer<typeof registerProviderSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
