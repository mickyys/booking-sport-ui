// Utilidades de fecha/hora civil.
//
// Históricamente todo el frontend asumía America/Santiago. Con la migración a
// reservas UTC cada centro puede tener su propia zona IANA, por lo que todas
// las funciones aceptan un `timeZone` opcional. El valor por defecto sigue
// siendo America/Santiago para no romper llamadas existentes: los centros
// históricos usan esa zona.

export const DEFAULT_TIMEZONE = 'America/Santiago';

const dateKeyFormatters = new Map<string, Intl.DateTimeFormat>();

function dateKeyFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = dateKeyFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    dateKeyFormatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Clave civil YYYY-MM-DD de un instante en la zona indicada. */
export function santiagoDateKey(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  const parts = dateKeyFormatter(timeZone).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

/** Clave civil de hoy en la zona indicada. */
export function todaySantiagoKey(timeZone: string = DEFAULT_TIMEZONE): string {
  return santiagoDateKey(new Date(), timeZone);
}

export function addDaysToSantiagoKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const instant = new Date(Date.UTC(y, m - 1, d, 12));
  instant.setUTCDate(instant.getUTCDate() + days);
  return santiagoDateKey(instant);
}

export function santiagoWeek(startKey: string, length = 7): string[] {
  return Array.from({ length }, (_, i) => addDaysToSantiagoKey(startKey, i));
}

/**
 * Instante portador de una fecha civil (mediodía UTC).
 *
 * Se usa para formatear el día sin que la zona del navegador lo desplace. No
 * representa el inicio de la reserva: para eso está `scheduled_at` del backend.
 */
export function santiagoDateInstant(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

const weekdayFormatter = new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', weekday: 'long' });
const dayFormatter = new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', day: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', month: 'long' });

export function santiagoLongDate(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  const [y, m, d] = santiagoDateKey(date, timeZone).split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12));
  return `${weekdayFormatter.format(utcDate)} ${dayFormatter.format(utcDate)} de ${monthFormatter.format(utcDate)}`;
}

/** Formatea un instante en la zona del centro (fecha y hora). */
export function formatInTimeZone(
  date: Date | string,
  timeZone: string = DEFAULT_TIMEZONE,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  const instant = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(instant.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', { ...options, timeZone }).format(instant);
}

/** Hora local HH:mm de un instante en la zona del centro. */
export function timeInTimeZone(date: Date | string, timeZone: string = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(date, timeZone, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Rango legible de una reserva usando los instantes canónicos del backend.
 * Si `ends_at` no viene (documento legacy), cae a `scheduled_at` + duración.
 */
export function bookingTimeRange(
  booking: {
    scheduled_at?: string;
    ends_at?: string;
    date?: string;
    hour?: number;
    minutes?: number;
    duration_minutes?: number;
  },
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  const start = booking.scheduled_at ?? booking.date;
  if (!start) return '';
  const startLabel = timeInTimeZone(start, timeZone);
  const end = booking.ends_at;
  if (!end) return startLabel;
  return `${startLabel}–${timeInTimeZone(end, timeZone)}`;
}
