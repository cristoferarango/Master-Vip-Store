/** Link de WhatsApp con mensaje pre-armado para coordinar una compra tipo Activación. */
export function buildActivationWhatsappLink(params: {
  whatsapp: string;
  productName: string;
  orderCode: string;
}): string {
  const { whatsapp, productName, orderCode } = params;
  const phone = whatsapp.replace(/\D/g, "");
  const message = `Hola! Soy de *Master VIP Store*.\nCompré: *${productName}*\nMi código de solicitud es: *${orderCode}*\n\nQuedo atento para coordinar la activación 🙌`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
