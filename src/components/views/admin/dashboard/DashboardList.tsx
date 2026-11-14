"use client";

import React from 'react';
import { CalendarX, ChevronRight } from 'lucide-react';
import {
  formatBookingDate,
  formatBookingTime,
  getCourtName,
  getCustomerName,
  getInitials,
  hasPendingBalance,
  paymentLabel,
  statusClass,
  statusLabel,
} from './dashboardUtils';

interface DashboardListProps {
  bookings: any[];
  courts: any[];
  loading: boolean;
  hasFilters: boolean;
  onSelect: (booking: any) => void;
  onClearFilters: () => void;
}

const ROW_GRID =
  'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_7rem_7.5rem_1rem] md:items-center md:gap-3';

const Row: React.FC<{ booking: any; courts: any[]; onSelect: (booking: any) => void }> = ({
  booking,
  courts,
  onSelect,
}) => {
  const name = getCustomerName(booking);
  const court = getCourtName(booking, courts);
  const pending = hasPendingBalance(booking);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(booking)}
        aria-label={`Ver detalle de la reserva de ${name}`}
        className={`group flex min-h-16 w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400/60 sm:px-4 ${ROW_GRID}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${statusClass(booking.status)}`}
            aria-hidden="true"
          >
            {getInitials(name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2 md:block">
              <span className="block truncate text-[15px] font-black text-slate-900">{name}</span>
              <span className="shrink-0 text-sm font-black text-slate-900 md:hidden">
                {formatBookingTime(booking)}
              </span>
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 md:hidden">
              <span className="truncate">{court}</span>
              <span aria-hidden="true">·</span>
              <span className="shrink-0 capitalize">{formatBookingDate(booking)}</span>
              <span
                className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${statusClass(booking.status)}`}
              >
                {statusLabel(booking.status)}
              </span>
            </span>
            <span className="hidden truncate font-mono text-xs font-medium text-slate-500 md:block">
              {booking.booking_code || 'Sin código'}
            </span>
          </span>
        </span>

        <span className="hidden truncate text-sm font-semibold text-slate-700 md:block">{court}</span>
        <span className="hidden text-sm font-semibold text-slate-700 md:block">
          <span className="capitalize">{formatBookingDate(booking)}</span>
          <span className="font-black text-slate-900"> · {formatBookingTime(booking)}</span>
        </span>
        <span className="hidden md:block">
          <span className="block text-sm font-semibold text-slate-700">
            {paymentLabel(booking.payment_method)}
          </span>
          {pending && (
            <span className="mt-0.5 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
              Abono pendiente
            </span>
          )}
        </span>
        <span className="hidden md:block">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${statusClass(booking.status)}`}
          >
            {statusLabel(booking.status)}
          </span>
        </span>

        <ChevronRight
          size={18}
          className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
          aria-hidden="true"
        />
      </button>
    </li>
  );
};

const ListSkeleton: React.FC = () => (
  <div
    role="status"
    aria-label="Cargando reservas"
    className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white"
  >
    {[0, 1, 2, 3, 4].map((row) => (
      <div key={row} className="flex items-center gap-3 px-4 py-4">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardList: React.FC<DashboardListProps> = ({
  bookings,
  courts,
  loading,
  hasFilters,
  onSelect,
  onClearFilters,
}) => {
  if (loading) return <ListSkeleton />;

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center sm:p-12">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <CalendarX size={24} />
        </span>
        <p className="text-sm font-black text-slate-800">No hay reservas</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {hasFilters
            ? 'No encontramos reservas con estos filtros.'
            : 'Cuando haya reservas aparecerán aquí.'}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div data-testid="dashboard-list" className="rounded-2xl border border-slate-200 bg-white">
      <div
        aria-hidden="true"
        className={`hidden border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-500 ${ROW_GRID}`}
      >
        <span>Cliente</span>
        <span>Cancha</span>
        <span>Fecha y hora</span>
        <span>Pago</span>
        <span>Estado</span>
        <span />
      </div>
      <ul className="divide-y divide-slate-100">
        {bookings.map((booking) => (
          <Row key={booking.id} booking={booking} courts={courts} onSelect={onSelect} />
        ))}
      </ul>
    </div>
  );
};
