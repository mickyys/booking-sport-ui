// Utilidades de teléfono chileno (RES-23). Formato aceptado: +56 seguido de
// 8 a 10 dígitos (cubre "+56 9 XXXX XXXX", "+56 2 XXXX XXXX", etc.).
export const CHILEAN_PHONE_PATTERN = /^\+56\s?\d{8,10}$/;

export function normalizeChileanPhone(phone: string): string {
  return phone.replace(/[\s.\-()]/g, '');
}

export function isValidChileanPhone(phone: string): boolean {
  return CHILEAN_PHONE_PATTERN.test(normalizeChileanPhone(phone.trim()));
}

// Formatea un teléfono chileno mientras se escribe: conserva "+56 " como
// prefijo y agrupa el resto en bloques de 4 dígitos (ej: +56 9 1234 5678).
export function formatChileanPhone(input: string): string {
  const raw = input.replace(/[^\d+]/g, '');
  if (raw === '') return '';
  if (!raw.startsWith('+')) {
    // Si el usuario no escribe el prefijo, se lo recordamos.
    const digits = raw.replace(/\D/g, '');
    const partial = digits.startsWith('56') ? digits.slice(2) : digits;
    return `+56 ${partial}`;
  }
  const country = raw.slice(0, 3); // "+56"
  const rest = raw.slice(3).replace(/\D/g, '').slice(0, 10);
  const groups: string[] = [];
  if (rest.length >= 1) groups.push(rest.slice(0, 1));
  if (rest.length >= 2) groups.push(rest.slice(1, 5));
  if (rest.length >= 6) groups.push(rest.slice(5, 9));
  if (rest.length >= 10) groups.push(rest.slice(9, 10));
  const suffix = groups.join(' ');
  return suffix ? `${country} ${suffix}` : country;
}