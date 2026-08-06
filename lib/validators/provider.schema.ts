import { z } from "zod";

export const updateProviderProfileSchema = z.object({
  businessName: z.string().trim().min(2, "El nombre del negocio es muy corto").max(80),
  bio: z.string().trim().max(600).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
});
export type UpdateProviderProfileInput = z.infer<typeof updateProviderProfileSchema>;
