export function buildWhatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, '');
  const text = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${text}`;
}

export const buildWhatsAppLink = buildWhatsappLink;
