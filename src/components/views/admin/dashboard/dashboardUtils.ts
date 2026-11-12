import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export type BookingStatusFilter = '' | 'confirmed' | 'pending' | 'cancelled' | 'expired';

export const STATUS_TABS: { key: BookingStatusFilter; label: string }[] = [
  { key: '', label: 'Todas' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'cancelled', label: 'Canceladas' },
];

export const formatCLP = (value: number | undefined | null): string =>
  `$${(value ?? 0).toLocaleString('es-CL')}`;

export const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const formatBookingDate = (booking: any): string => {
  const date = toDate(booking.date);
  return date ? format(date, 'EEE d MMM', { locale: es }) : '—';
};

export const formatBookingTime = (booking: any): string =>
  `${String(booking.hour ?? 0).padStart(2, '0')}:${String(booking.minutes ?? 0).padStart(2, '0')}`;

export const formatCreatedAt = (booking: any): string => {
  const date = toDate(booking.createdAt);
  return date ? format(date, 'd MMM HH:mm', { locale: es }) : '';
};

export const getCourtName = (booking: any, courts: any[]): string =>
  booking.court_name || courts.find((court) => court.id === booking.courtId)?.name || 'Sin cancha';

export const getCustomerName = (booking: any): string =>
  booking.customerName || booking.user_name || 'Sin nombre';

export const statusLabel = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'pending':
      return 'Pendiente';
    case 'expired':
      return 'Expirada';
    default:
      return 'Cancelada';
  }
};

export const statusClass = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'expired':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-red-100 text-red-700';
  }
};

export const paymentLabel = (method: string): string => {
  if (method === 'mercadopago') return 'MercadoPago';
  if (method === 'presential') return 'Presencial';
  if (method === 'flow') return 'Flow';
  return 'Interno';
};

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const hasPendingBalance = (booking: any): boolean =>
  !!booking.isPartialPayment && !booking.partialPaymentPaid;
