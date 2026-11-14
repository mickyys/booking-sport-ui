/** Deja el teléfono en formato internacional para `tel:` y `wa.me`. */
export const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('56')) return digits;
  if (digits.length === 9 || digits.length === 8) return `56${digits}`;
  return digits;
};

export const getTelUrl = (phone: string): string => {
  const normalized = normalizePhone(phone);
  return normalized ? `tel:+${normalized}` : '';
};

export const getWhatsappUrl = (phone: string, message?: string): string => {
  const normalized = normalizePhone(phone);
  if (!normalized) return '';
  const text = message?.trim();
  return text
    ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${normalized}`;
};

/** Enlace de WhatsApp sin destinatario, para compartir un texto con cualquier contacto. */
export const getWhatsappShareUrl = (message: string): string =>
  `https://wa.me/?text=${encodeURIComponent(message)}`;
