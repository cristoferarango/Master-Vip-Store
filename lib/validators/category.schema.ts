import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(40),
  iconUrl: z.string().trim().max(500).optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
