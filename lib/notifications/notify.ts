import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { NotificationType, NotificationChannel } from "@prisma/client";

/**
 * Envío de notificaciones — STUB.
 *
 * Por ahora solo registra la notificación en la tabla Notification y hace
 * console.log; no envía WhatsApp real todavía. Cuando se integre un
 * proveedor real (ej. WhatsApp Business API / Twilio), esta función es el
 * único lugar que hay que modificar: todo el resto de la app ya llama a
 * sendNotification() y no le importa el canal real de envío.
 */
export async function sendNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel;
}): Promise<void> {
  const { userId, type, title, message, channel = "WHATSAPP" } = params;

  const notification = await prisma.notification.create({
    data: { userId, type, title, message, channel },
  });

  // TODO: integrar envío real de WhatsApp (Twilio / WhatsApp Business API).
  // Cuando exista integración real, marcar sentAt tras el envío exitoso:
  //   await prisma.notification.update({ where: { id: notification.id }, data: { sentAt: new Date() } });
  console.log(
    `[notify:stub] -> user=${userId} canal=${channel} tipo=${type}: "${title}" (notification id=${notification.id})`
  );
}
