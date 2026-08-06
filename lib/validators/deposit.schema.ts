import { z } from "zod";

export const createDepositRequestSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0").max(5000),
  operationCode: z.string().trim().max(60).optional(),
  screenshotUrl: z.string().trim().max(500).optional(),
});
export type CreateDepositRequestInput = z.infer<typeof createDepositRequestSchema>;

export const reviewDepositRequestSchema = z.object({
  depositId: z.string().min(1),
  rejectionReason: z.string().trim().max(300).optional(),
});
export type ReviewDepositRequestInput = z.infer<typeof reviewDepositRequestSchema>;
