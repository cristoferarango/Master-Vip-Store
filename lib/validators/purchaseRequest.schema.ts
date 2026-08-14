import { z } from "zod";

export const createPurchaseRequestSchema = z.object({
  productId: z.string().min(1),
  screenshotUrl: z.string().trim().min(1, "Sube la captura de tu pago por Yape"),
  operationCode: z.string().trim().max(60).optional(),
  // Solo para productos tipo ACTIVACION/ACTIVACION2: el correo donde se activará el servicio.
  clientEmail: z.string().trim().email("Ingresa un correo válido").optional(),
  // Solo ACTIVACION2 con activacion2RequestsPassword=true: la contraseña de SU cuenta.
  clientPassword: z.string().trim().min(1).max(200).optional(),
});
export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;
