import { z } from "zod";

const timeOrEmpty = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato de hora inválido")
  .optional()
  .or(z.literal(""));

export const scheduleSchema = z
  .object({
    opensAt: timeOrEmpty,
    closesAt: timeOrEmpty,
  })
  .refine((d) => !!d.opensAt === !!d.closesAt, {
    message: "Completa ambas horas, o deja las dos vacías para estar disponible todo el día.",
    path: ["closesAt"],
  });

export type ScheduleInput = z.infer<typeof scheduleSchema>;
