import { z } from "zod";

export const updateProviderProfileSchema = z.object({
  businessName: z.string().trim().min(2, "El nombre del negocio es muy corto").max(80),
  bio: z.string().trim().max(600).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
});
export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;

export const updateProviderPaymentSchema = z.object({
  yapeNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{6,20}$/, "Ingresa un número de Yape válido"),
  yapeName: z.string().trim().min(2, "Ingresa el nombre que sale en tu Yape").max(80),
  yapeQrUrl: z.string().trim().max(500).optional(),
});
export type UpdateProviderPaymentInput = z.infer<typeof updateProviderPaymentSchema>;
