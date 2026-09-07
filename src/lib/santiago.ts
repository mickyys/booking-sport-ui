const SANTIAGO_TZ = 'America/Santiago';

const santiagoParts = new Intl.DateTimeFormat('en-US', {
  timeZone: SANTIAGO_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function santiagoDateKey(date: Date): string {
  const parts = santiagoParts.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

export function todaySantiagoKey(): string {
  return santiagoDateKey(new Date());
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

export function santiagoDateInstant(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

const weekdayFormatter = new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', weekday: 'long' });
const dayFormatter = new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', day: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', month: 'long' });

export function santiagoLongDate(date: Date): string {
  const [y, m, d] = santiagoDateKey(date).split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12));
  return `${weekdayFormatter.format(utcDate)} ${dayFormatter.format(utcDate)} de ${monthFormatter.format(utcDate)}`;
}