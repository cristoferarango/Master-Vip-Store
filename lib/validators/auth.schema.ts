import { z } from "zod";

// Solo números de celular de Perú: 9 dígitos, empieza en 9 (con o sin +51).
const whatsappRegex = /^(?:\+?51)?9\d{8}$/;
const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;

export const registerClientSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  username: z.string().trim().regex(usernameRegex, "3-20 caracteres: letras, números, punto o guión bajo"),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  whatsapp: z
    .string()
    .trim()
    .regex(whatsappRegex, "Ingresa un número peruano válido (9 dígitos, empieza en 9)"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  referredByCode: z.string().trim().toUpperCase().max(20).optional().or(z.literal("")),
});
export type RegisterClientInput = z.infer<typeof registerClientSchema>;

export const registerProviderSchema = registerClientSchema.extend({
  businessName: z.string().trim().min(2, "El nombre del negocio es muy corto").max(80),
});
export type RegisterProviderInput = z.infer<typeof registerProviderSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Ingresa tu usuario"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** WhatsApp editable desde Perfil (proveedor o cliente) — mismo formato Perú. */
export const updateWhatsappSchema = z.object({
  whatsapp: z.string().trim().regex(whatsappRegex, "Ingresa un número peruano válido (9 dígitos, empieza en 9)"),
});
export type UpdateWhatsappInput = z.infer<typeof updateWhatsappSchema>;
