export function cleanRUT(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRUT(input: string): string {
  const clean = cleanRUT(input).slice(0, 9);
  if (clean.length < 8) {
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}

export function validateRUT(rut: string): boolean {
  const clean = cleanRUT(rut);
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  // Dígito verificador módulo 11: cada dígito del cuerpo se multiplica por la
  // secuencia 2..7 (de derecha a izquierda, cíclica); DV = 11 - (suma % 11),
  // donde 11 se representa como '0' y 10 como 'K'.
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const remainder = 11 - (sum % 11);
  const expectedDv =
    remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return dv === expectedDv;
}
