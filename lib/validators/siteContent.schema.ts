import { z } from "zod";

const hubCardSchema = z.object({
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(200),
  buttonLabel: z.string().trim().min(1).max(40),
  iconUrl: z.string().trim().max(500).optional(),
});

export const siteContentSchema = z.object({
  hubCards: z.array(hubCardSchema).length(3),
  streamingTitle: z.string().trim().min(1).max(120),
  streamingDescription: z.string().trim().min(1).max(300),
});
export type SiteContentInput = z.infer<typeof siteContentSchema>;

/** Textos por defecto — se usan mientras el dueño no haya editado nada desde el Panel VIP. */
export const DEFAULT_SITE_CONTENT: SiteContentInput = {
  hubCards: [
    { title: "Streaming", description: "Netflix, HBO Max, Canva, ChatGPT y más. Compra cuentas al instante.", buttonLabel: "Entrar a la tienda" },
    { title: "Proveedores", description: "Publica tus cuentas, gestiona tu stock y controla tus ventas y ganancias.", buttonLabel: "Acceso proveedores" },
    { title: "Master Vip Store", description: "Control del panel Master Vip Store.", buttonLabel: "Acceso VIP" },
  ],
  streamingTitle: "Cuentas premium al mejor precio, al instante",
  streamingDescription: "Netflix, HBO Max, Canva, ChatGPT, Gemini, Claude, IPTV y más — con proveedores verificados y soporte por WhatsApp.",
};
