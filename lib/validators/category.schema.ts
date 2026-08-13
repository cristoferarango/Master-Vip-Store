import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(40),
  icon: z.string().trim().max(8, "Usa un solo emoji o ícono corto").optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
