import { z } from "zod";

export const createPurchaseRequestSchema = z.object({
  productId: z.string().min(1),
  screenshotUrl: z.string().trim().min(1, "Sube la captura de tu pago por Yape"),
  operationCode: z.string().trim().max(60).optional(),
  // Solo para productos tipo ACTIVACION: el correo donde se activará el servicio.
  clientEmail: z.string().trim().email("Ingresa un correo válido").optional(),
});
export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;
