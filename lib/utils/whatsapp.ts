/** Link de WhatsApp con mensaje pre-armado para coordinar una compra tipo Activación. */
export function buildActivationWhatsappLink(params: {
  whatsapp: string;
  productName: string;
  orderCode: string;
  clientEmail?: string;
  time?: string;
}): string {
  const { whatsapp, productName, orderCode, clientEmail, time } = params;
  const phone = whatsapp.replace(/\D/g, "");
  const message = `Hola! Soy de *Master VIP Store*.\nCompré: *${productName}*\nMi código de solicitud es: *${orderCode}*${
    time ? `\nHora: *${time}*` : ""
  }${clientEmail ? `\nMi correo: *${clientEmail}*` : ""}\n\nQuedo atento para coordinar la activación 🙌`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** Link de WhatsApp para que un cliente/proveedor le pida al dueño que le restablezca su contraseña. */
export function buildRecoveryWhatsappLink(params: {
  whatsapp: string;
  recoveryEmail: string;
  username: string;
}): string {
  const { whatsapp, recoveryEmail, username } = params;
  const phone = whatsapp.replace(/\D/g, "");
  const message = `Hola! Olvidé mi contraseña de *Master VIP Store*.\nMi correo: *${recoveryEmail}*\nMi usuario: *${username}*\n\n¿Me ayudas a restablecerla? 🙏`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
