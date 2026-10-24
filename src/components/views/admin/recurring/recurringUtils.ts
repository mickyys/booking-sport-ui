import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Utilidades de reservas recurrentes.
 *
 * El backend expone dos modelos distintos:
 * - `weekly`: reservas indefinidas, una por cada día de la semana.
 * - `series`: series con una cantidad de semanas y una fecha de término.
 *
 * Aquí se normalizan ambos a un único `RecurringItem` para que la vista no
 * tenga que distinguir tipos con casts dispersos.
 */

export const DAY_NAMES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

/** Orden visual de la semana: lunes primero, domingo al final. */
export const WEEKDAY_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0];

export const WEEKDAY_CHIPS: { index: number; short: string; label: string }[] = [
  { index: 1, short: 'Lun', label: 'Lunes' },
  { index: 2, short: 'Mar', label: 'Martes' },
  { index: 3, short: 'Mié', label: 'Miércoles' },
  { index: 4, short: 'Jue', label: 'Jueves' },
  { index: 5, short: 'Vie', label: 'Viernes' },
  { index: 6, short: 'Sáb', label: 'Sábado' },
  { index: 0, short: 'Dom', label: 'Domingo' },
];

export interface WeeklyRecurringRaw {
  id: string;
  sport_center_id?: string;
  sport_center_name?: string;
  court_id?: string;
  court_name?: string;
  customer_name?: string;
  customer_phone?: string;
  hour?: number;
  minutes?: number;
  day_of_week?: number;
  day_of_week_name?: string;
  price?: number;
  notes?: string;
  status?: string;
  cancelled_by?: string;
  cancel_reason?: string;
  created_at?: string;
  updated_at?: string;
  finished_at?: string;
}

export interface SeriesRecurringRaw {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  sport_center_id?: string;
  court_id?: string;
  court_name?: string;
  hour?: number;
  minutes?: number;
  start_date?: string;
  end_date?: string | null;
  finished_at?: string;
  total_bookings?: number;
  confirmed_bookings?: number;
  price?: number;
  status?: string;
  cancel_reason?: string;
  created_at?: string;
}

interface RecurringItemBase {
  id: string;
  customerName: string;
  customerPhone: string;
  courtId: string;
  courtName: string;
  hour: number;
  minutes: number;
  price: number;
  dayIndex: number;
  dayLabel: string;
  isFinished: boolean;
  nextDate: Date | null;
  finishedAt: Date | null;
  createdAt: Date | null;
  cancelReason?: string;
  searchText: string;
}

export interface WeeklyRecurringItem extends RecurringItemBase {
  kind: 'weekly';
  notes?: string;
}

export interface SeriesRecurringItem extends RecurringItemBase {
  kind: 'series';
  startDate: Date | null;
  endDate: Date | null;
  totalBookings: number;
  confirmedBookings: number;
  progress: number;
}

export type RecurringItem = WeeklyRecurringItem | SeriesRecurringItem;

export type RecurringTab = 'active' | 'finished';
export type DayFilter = number | 'all';
export type CourtFilter = string | 'all';

export interface RecurringFilters {
  tab: RecurringTab;
  query: string;
  courtId: CourtFilter;
  dayIndex: DayFilter;
}

export interface RecurringStats {
  active: number;
  weekly: number;
  series: number;
  finished: number;
  weeklyIncome: number;
}

export interface RecurringGroup {
  dayIndex: number;
  label: string;
  short: string;
  items: RecurringItem[];
  income: number;
}

const clampInt = (value: unknown, min: number, max: number, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
};

export const parseDateSafe = (value?: string | null): Date | null => {
  if (!value) return null;
  // Las fechas sin hora ("YYYY-MM-DD") deben interpretarse en horario local.
  // `new Date("2026-10-05")` las interpreta como UTC y en Chile (UTC-3) cae en
  // el día anterior, mostrando el día de la semana equivocado.
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) return null;
  return date;
};

/** Próxima ocurrencia de un día/hora. `from` se usa como límite inferior. */
const nextOccurrenceFor = (
  dayIndex: number,
  hour: number,
  minutes: number,
  from: Date,
  endDate: Date | null,
): Date | null => {
  let candidate = startOfDay(from);
  const delta = (dayIndex - candidate.getDay() + 7) % 7;
  candidate = addDays(candidate, delta);
  candidate.setHours(hour, minutes, 0, 0);

  if (candidate.getTime() < from.getTime()) {
    candidate = addDays(candidate, 7);
  }

  if (endDate && startOfDay(candidate).getTime() > startOfDay(endDate).getTime()) {
    return null;
  }

  return candidate;
};

/** Fechas futuras de la recurrencia, para el panel de detalle. */
export const getUpcomingDates = (item: RecurringItem, count = 3): Date[] => {
  if (item.isFinished) return [];

  const now = new Date();
  let from = now;
  let endDate: Date | null = null;

  if (item.kind === 'series') {
    if (item.startDate && item.startDate.getTime() > now.getTime()) {
      from = startOfDay(item.startDate);
    }
    endDate = item.endDate;
  }

  const dates: Date[] = [];
  let cursor = from;

  for (let index = 0; index < count; index += 1) {
    const next = nextOccurrenceFor(item.dayIndex, item.hour, item.minutes, cursor, endDate);
    if (!next) break;
    dates.push(next);
    cursor = addDays(next, 1);
  }

  return dates;
};

const buildBase = (common: {
  id: string;
  customerName: string;
  customerPhone: string;
  courtId: string;
  courtName: string;
  hour: number;
  minutes: number;
  price: number;
  dayIndex: number;
  isFinished: boolean;
  nextDate: Date | null;
  finishedAt: Date | null;
  createdAt: Date | null;
  cancelReason?: string;
  searchText: string;
}): RecurringItemBase => ({
  ...common,
  dayLabel: DAY_NAMES[common.dayIndex] || 'Sin día',
});

const normalizeWeekly = (raw: WeeklyRecurringRaw): WeeklyRecurringItem => {
  const createdAt = parseDateSafe(raw.created_at);
  const finishedAt = parseDateSafe(raw.finished_at);
  const rawDay = clampInt(raw.day_of_week, 0, 6, -1);
  const dayIndex = rawDay >= 0 ? rawDay : createdAt ? createdAt.getDay() : 0;
  const hour = clampInt(raw.hour, 0, 23, 0);
  const minutes = clampInt(raw.minutes, 0, 59, 0);
  const isFinished = raw.status === 'finished' || raw.status === 'cancelled' || !!finishedAt;
  const nextDate = isFinished ? null : nextOccurrenceFor(dayIndex, hour, minutes, new Date(), null);

  const customerName = raw.customer_name?.trim() || 'Sin nombre';
  const customerPhone = raw.customer_phone?.trim() || '';
  const courtName = raw.court_name?.trim() || 'Sin cancha';

  return {
    ...buildBase({
      id: raw.id,
      customerName,
      customerPhone,
      courtId: raw.court_id || '',
      courtName,
      hour,
      minutes,
      price: Number(raw.price) || 0,
      dayIndex,
      isFinished,
      nextDate,
      finishedAt,
      createdAt,
      cancelReason: raw.cancel_reason,
      searchText: `${customerName} ${customerPhone} ${courtName} ${DAY_NAMES[dayIndex] || ''}`.toLowerCase(),
    }),
    kind: 'weekly',
    notes: raw.notes?.trim() || undefined,
  };
};

const normalizeSeries = (raw: SeriesRecurringRaw): SeriesRecurringItem => {
  const startDate = parseDateSafe(raw.start_date);
  const endDate = parseDateSafe(raw.end_date);
  const finishedAtRaw = parseDateSafe(raw.finished_at);
  const createdAt = startDate || parseDateSafe(raw.created_at);
  const dayIndex = startDate ? startDate.getDay() : 0;
  const hour = clampInt(raw.hour, 0, 23, 0);
  const minutes = clampInt(raw.minutes, 0, 59, 0);

  const endedByDate = !!endDate && startOfDay(endDate).getTime() < startOfDay(new Date()).getTime();
  const isFinished = raw.status === 'finished' || raw.status === 'cancelled' || !!finishedAtRaw || endedByDate;

  const from = startDate && startDate.getTime() > Date.now() ? startOfDay(startDate) : new Date();
  const nextDate = isFinished ? null : nextOccurrenceFor(dayIndex, hour, minutes, from, endDate);

  const totalBookings = Math.max(0, clampInt(raw.total_bookings, 0, Number.MAX_SAFE_INTEGER, 0));
  const confirmedBookings = Math.min(totalBookings, Math.max(0, clampInt(raw.confirmed_bookings, 0, Number.MAX_SAFE_INTEGER, 0)));
  const customerName = raw.customer_name?.trim() || 'Sin nombre';
  const customerPhone = raw.customer_phone?.trim() || '';
  const courtName = raw.court_name?.trim() || 'Sin cancha';

  return {
    ...buildBase({
      id: raw.id,
      customerName,
      customerPhone,
      courtId: raw.court_id || '',
      courtName,
      hour,
      minutes,
      price: Number(raw.price) || 0,
      dayIndex,
      isFinished,
      nextDate,
      finishedAt: finishedAtRaw || (isFinished ? endDate : null),
      createdAt,
      cancelReason: raw.cancel_reason,
      searchText: `${customerName} ${customerPhone} ${courtName} ${DAY_NAMES[dayIndex] || ''}`.toLowerCase(),
    }),
    kind: 'series',
    startDate,
    endDate,
    totalBookings,
    confirmedBookings,
    progress: totalBookings > 0 ? Math.min(100, Math.round((confirmedBookings / totalBookings) * 100)) : 0,
  };
};

export const normalizeRecurring = (
  weekly: WeeklyRecurringRaw[],
  series: SeriesRecurringRaw[],
): RecurringItem[] => {
  const weeklyItems = weekly
    .filter((item) => item.status !== 'cancelled')
    .map(normalizeWeekly);
  const seriesItems = series
    .filter((item) => item.status !== 'cancelled')
    .map(normalizeSeries);

  return [...weeklyItems, ...seriesItems].sort(compareItems);
};

const compareItems = (a: RecurringItem, b: RecurringItem): number => {
  const dayDiff = WEEKDAY_ORDER.indexOf(a.dayIndex) - WEEKDAY_ORDER.indexOf(b.dayIndex);
  if (dayDiff !== 0) return dayDiff;
  if (a.hour !== b.hour) return a.hour - b.hour;
  if (a.minutes !== b.minutes) return a.minutes - b.minutes;
  return a.customerName.localeCompare(b.customerName, 'es');
};

export const getRecurringStats = (items: RecurringItem[]): RecurringStats => {
  const activeItems = items.filter((item) => !item.isFinished);
  return {
    active: activeItems.length,
    weekly: activeItems.filter((item) => item.kind === 'weekly').length,
    series: activeItems.filter((item) => item.kind === 'series').length,
    finished: items.length - activeItems.length,
    weeklyIncome: activeItems.reduce((total, item) => total + item.price, 0),
  };
};

export const getCourts = (items: RecurringItem[]): { id: string; name: string }[] => {
  const unique = new Map<string, string>();
  items.forEach((item) => {
    if (!item.courtId) return;
    if (!unique.has(item.courtId)) unique.set(item.courtId, item.courtName);
  });
  return Array.from(unique, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

export const filterRecurring = (items: RecurringItem[], filters: RecurringFilters): RecurringItem[] => {
  const term = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.tab === 'active' && item.isFinished) return false;
    if (filters.tab === 'finished' && !item.isFinished) return false;
    if (filters.dayIndex !== 'all' && item.dayIndex !== filters.dayIndex) return false;
    if (filters.courtId !== 'all' && item.courtId !== filters.courtId) return false;
    if (term && !item.searchText.includes(term)) return false;
    return true;
  });
};

export const hasActiveFilters = (filters: RecurringFilters): boolean =>
  filters.query.trim() !== '' || filters.courtId !== 'all' || filters.dayIndex !== 'all';

/** Filtros que viven dentro del panel (cancha y día). */
export const countPanelFilters = (filters: RecurringFilters): number =>
  (filters.courtId !== 'all' ? 1 : 0) + (filters.dayIndex !== 'all' ? 1 : 0);

export const getKindLabel = (item: RecurringItem): string => {
  if (item.isFinished) return 'Finalizada';
  if (item.kind === 'weekly') return 'Cada semana';
  return item.endDate ? `Hasta ${format(item.endDate, 'd MMM', { locale: es })}` : 'Serie';
};

export const groupByDay = (items: RecurringItem[]): RecurringGroup[] => {
  const groups = new Map<number, RecurringItem[]>();
  items.forEach((item) => {
    const list = groups.get(item.dayIndex) || [];
    list.push(item);
    groups.set(item.dayIndex, list);
  });

  return WEEKDAY_ORDER
    .filter((dayIndex) => groups.has(dayIndex))
    .map((dayIndex) => {
      const dayItems = (groups.get(dayIndex) || []).sort(compareItems);
      return {
        dayIndex,
        label: DAY_NAMES[dayIndex],
        short: formatDayShort(dayIndex),
        items: dayItems,
        income: dayItems.filter((item) => !item.isFinished).reduce((total, item) => total + item.price, 0),
      };
    });
};

const formatDayShort = (dayIndex: number): string => {
  const chip = WEEKDAY_CHIPS.find((day) => day.index === dayIndex);
  return chip?.short || '—';
};

export const formatCLP = (value: number | undefined | null): string =>
  (value ?? 0).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

export const formatHour = (hour: number, minutes = 0): string =>
  `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

export const formatRelativeDay = (date: Date): string => {
  const diff = differenceInCalendarDays(date, new Date());
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  const label = format(date, "EEE d 'de' MMM", { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const formatShortDate = (date?: Date | null): string =>
  date ? format(date, 'd MMM yyyy', { locale: es }) : '—';

export const formatLongDate = (date?: Date | null): string =>
  date ? format(date, "d 'de' MMMM 'de' yyyy", { locale: es }) : '—';

export const formatRange = (item: RecurringItem): string => {
  if (item.kind === 'weekly') {
    return item.createdAt ? `Desde ${formatShortDate(item.createdAt)} · sin término` : 'Sin fecha de término';
  }
  if (!item.startDate && !item.endDate) return 'Sin fechas registradas';
  return `${formatShortDate(item.startDate)} → ${item.endDate ? formatShortDate(item.endDate) : 'sin término'}`;
};

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

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
