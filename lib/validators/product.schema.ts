import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(3, "El nombre es muy corto").max(120),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  imageUrl: z.string().min(1, "Sube una imagen del producto"),
  description: z.string().trim().min(10, "Agrega una descripción").max(4000),
  conditions: z.string().trim().min(10, "Agrega las condiciones de venta").max(4000),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  durationDays: z.coerce.number().int().positive("Los días de vigencia deben ser mayor a 0"),
});
export type ProductInput = z.infer<typeof productSchema>;

export const accountStockSchema = z.object({
  productId: z.string().min(1),
  username: z.string().trim().min(1, "Ingresa el usuario/correo de la cuenta"),
  password: z.string().trim().min(1, "Ingresa la contraseña de la cuenta"),
  extraInfo: z.string().trim().max(2000).optional(),
});
export type AccountStockInput = z.infer<typeof accountStockSchema>;
