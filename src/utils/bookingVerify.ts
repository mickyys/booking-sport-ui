import React from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import {
  DEFAULT_TIMEZONE, formatInTimeZone, santiagoDateInstant, santiagoLongDate, timeInTimeZone,
} from '@/lib/santiago';

export interface VerifiedBooking {
  code: string;
  status: string;
  centerName: string;
  centerSlug?: string;
  address: string;
  spaceName: string;
  customerName: string;
  paymentMethod: string;
  paid: number;
  pending: number;
  total: number;
  canCancel: boolean;
  /** Cada línea es un día (y hora, si aplica) reservado. */
  schedule: string[];
}

export const STATUS_STYLES: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  confirmed: { label: 'Reserva confirmada', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle },
  pending: { label: 'Pago pendiente', className: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
  cancelled: { label: 'Reserva cancelada', className: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
  expired: { label: 'Reserva expirada', className: 'bg-slate-100 text-slate-600 border-slate-200', Icon: XCircle },
};

export const PAYMENT_LABELS: Record<string, string> = {
  mercadopago: 'MercadoPago',
  venue: 'Pago en el centro',
  cash: 'Pago en el centro',
  presential: 'Pago en el centro',
  internal: 'Pago en el centro',
};

export const money = (n: number) => `$${(n || 0).toLocaleString('es-CL')}`;

export function buildShareText(booking: VerifiedBooking): string {
  const extra = booking.schedule.length > 1 ? ` (+${booking.schedule.length - 1} días)` : '';
  return `Mi reserva en ${booking.centerName} · ${booking.schedule[0]}${extra} · Código ${booking.code}`;
}

export function parseBookingResponse(code: string, data: any): VerifiedBooking {
  if (data?.type === 'facility') {
    const days: any[] = data.bookings || [];
    if (days.length === 0) throw new Error('not found');
    const first = days[0];
    const status = days.some((d) => d.status === 'confirmed')
      ? 'confirmed'
      : days.some((d) => d.status === 'pending')
        ? 'pending'
        : first.status;
    return {
      code,
      status,
      centerName: first.sport_center_name,
      address: '',
      spaceName: first.space_name,
      customerName: first.customer_name,
      paymentMethod: first.payment_method,
      paid: days.reduce((s, d) => s + d.paid_amount, 0),
      pending: days.reduce((s, d) => s + d.pending_amount, 0),
      total: days.reduce((s, d) => s + d.price, 0),
      canCancel: false,
      schedule: days.map((d) => santiagoLongDate(santiagoDateInstant(d.local_date))),
    };
  }

  const b = data.booking_detail;
  const timeZone = b.timezone || DEFAULT_TIMEZONE;
  const when = b.scheduled_at ? new Date(b.scheduled_at) : b.date ? new Date(b.date) : null;
  const date = when ? formatInTimeZone(when, timeZone, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const time = b.scheduled_at
    ? timeInTimeZone(b.scheduled_at, timeZone)
    : `${String(b.hour).padStart(2, '0')}:${String(b.minutes ?? 0).padStart(2, '0')}`;
  return {
    code,
    status: b.status,
    centerName: b.sport_center_name,
    centerSlug: b.sport_center_slug,
    address: [b.sport_center_address, b.sport_center_city].filter(Boolean).join(', '),
    spaceName: b.court_name,
    customerName: b.customer_name,
    paymentMethod: b.payment_method,
    paid: b.paid_amount,
    pending: b.pending_amount,
    total: b.price,
    canCancel: !!data.can_cancel,
    schedule: [`${date} · ${time} hrs`],
  };
}
