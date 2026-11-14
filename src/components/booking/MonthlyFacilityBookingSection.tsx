"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Users, Building, CheckCircle, X, CalendarCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, addMonths, format, startOfMonth, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { MonthlyFacility } from '@/data/facilities';
import { BrandingPalette } from '@/utils/branding';
import { getSpaceAvailabilityRange } from '@/api/bookingApi';
import { Calendar } from '@/components/ui/calendar';
import { FacilityCheckoutModal } from './FacilityCheckoutModal';
import { useAuth } from '@/hooks/useAuth';

const MAX_DAYS_AHEAD = 365;
const monthKey = (d: Date) => format(d, 'yyyy-MM');
const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

interface MonthlyFacilityBookingSectionProps {
  facility: MonthlyFacility;
  branding: BrandingPalette;
}

export const MonthlyFacilityBookingSection: React.FC<MonthlyFacilityBookingSectionProps> = ({
  facility,
  branding,
}) => {
  const { user } = useAuth();
  const today = useMemo(() => startOfToday(), []);
  const lastDay = useMemo(() => addDays(today, MAX_DAYS_AHEAD), [today]);

  const [visibleMonth, setVisibleMonth] = useState<Date>(startOfMonth(today));
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showModal, setShowModal] = useState(false);
  // 'yyyy-MM' -> set de días no disponibles ('yyyy-MM-dd')
  const [unavailable, setUnavailable] = useState<Record<string, Set<string>>>({});
  const [loadingMonths, setLoadingMonths] = useState<Set<string>>(new Set());
  const requested = useRef<Set<string>>(new Set());

  // Al cambiar de espacio se reinicia la selección y la caché de disponibilidad.
  useEffect(() => {
    setSelectedDates([]);
    setUnavailable({});
    setLoadingMonths(new Set());
    requested.current = new Set();
    setVisibleMonth(startOfMonth(today));
  }, [facility.id, today]);

  const loadMonth = useCallback(
    (month: Date) => {
      if (month < startOfMonth(today) || month > lastDay) return;
      const key = monthKey(month);
      if (requested.current.has(key)) return;
      requested.current.add(key);
      setLoadingMonths((prev) => new Set(prev).add(key));
      const from = format(startOfMonth(month), 'yyyy-MM-dd');
      const to = format(new Date(month.getFullYear(), month.getMonth() + 1, 0), 'yyyy-MM-dd');
      getSpaceAvailabilityRange(facility.id, from, to)
        .then((res) => {
          const set = new Set<string>();
          Object.entries(res || {}).forEach(([date, a]) => {
            if (a?.closed || a?.blocked || a?.booked) set.add(date);
          });
          setUnavailable((prev) => ({ ...prev, [key]: set }));
        })
        .catch(() => {
          requested.current.delete(key);
        })
        .finally(() => {
          setLoadingMonths((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        });
    },
    [facility.id, today, lastDay]
  );

  // Carga el mes visible y precarga el siguiente.
  useEffect(() => {
    loadMonth(visibleMonth);
    loadMonth(addMonths(visibleMonth, 1));
  }, [visibleMonth, loadMonth]);

  const isDisabled = useCallback(
    (date: Date) => date < today || date > lastDay || !!unavailable[monthKey(date)]?.has(dayKey(date)),
    [today, lastDay, unavailable]
  );

  const sortedDates = useMemo(
    () => [...selectedDates].sort((a, b) => a.getTime() - b.getTime()),
    [selectedDates]
  );
  const count = sortedDates.length;
  const totalPrice = count * facility.pricePerDay;
  const isLoadingVisible = loadingMonths.has(monthKey(visibleMonth));

  const removeDate = (d: Date) => setSelectedDates((prev) => prev.filter((x) => dayKey(x) !== dayKey(d)));

  return (
    <div>
      <div className="relative mb-5 h-40 overflow-hidden rounded-2xl">
        <img src={facility.image} alt={facility.name} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(15,23,42,0.88))' }} />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white">{facility.name}</h3>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/90">
            {facility.capacity > 0 && (
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" />Capacidad: {facility.capacity} personas</span>
            )}
            {facility.area && <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" aria-hidden="true" />{facility.area}</span>}
            <span className="font-bold">${facility.pricePerDay.toLocaleString('es-CL')}/día</span>
          </div>
        </div>
      </div>

      {facility.features.length > 0 && (
        <ul className="mb-6 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {facility.features.map((f) => (
            <li key={f} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
              <CheckCircle className="h-4 w-4 shrink-0" style={{ color: branding.primary }} aria-hidden="true" />
              <span className="text-sm text-slate-700">{f}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800">Elige los días que necesitas</p>
        {count > 0 && (
          <button
            type="button"
            onClick={() => setSelectedDates([])}
            className="inline-flex min-h-11 items-center gap-1 px-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" /> Limpiar
          </button>
        )}
      </div>

      <div className="relative rounded-2xl border border-slate-200 p-2">
        <Calendar
          mode="multiple"
          locale={es}
          weekStartsOn={1}
          selected={selectedDates}
          onSelect={(dates) => setSelectedDates(dates ?? [])}
          month={visibleMonth}
          onMonthChange={(m) => setVisibleMonth(startOfMonth(m))}
          fromDate={today}
          toDate={lastDay}
          disabled={isDisabled}
          showOutsideDays={false}
          className="w-full p-1"
          classNames={{
            months: 'flex flex-col w-full',
            month: 'flex flex-col gap-3 w-full',
            caption: 'flex justify-center items-center relative h-11',
            caption_label: 'text-base font-bold capitalize',
            nav_button: 'size-11 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30',
            nav_button_previous: 'absolute left-0',
            nav_button_next: 'absolute right-0',
            table: 'w-full border-collapse',
            head_row: 'flex w-full',
            head_cell: 'flex-1 text-center text-xs font-semibold uppercase text-slate-500 py-1',
            row: 'flex w-full mt-1',
            cell: 'flex-1 p-0.5 text-center text-sm relative',
            day: 'h-11 w-full rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 aria-selected:opacity-100',
            day_today: 'ring-1 ring-slate-400',
            day_disabled: 'text-slate-300 line-through opacity-100 hover:bg-transparent cursor-not-allowed',
            day_selected: 'text-white hover:text-white',
          }}
          modifiersStyles={{ selected: { backgroundColor: branding.primary, color: '#fff' } }}
        />
        {isLoadingVisible && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60" role="status" aria-live="polite">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: branding.primary }} />
            <span className="sr-only">Cargando disponibilidad</span>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-600">
        Los días tachados no están disponibles. Puedes elegir días sueltos hasta {format(lastDay, "d 'de' MMMM yyyy", { locale: es })}.
      </p>

      {count > 0 && (
        <div className="mt-5 rounded-2xl border-2 p-4" style={{ borderColor: `${branding.primary}40`, backgroundColor: `${branding.primary}08` }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-700">
              {count} día{count > 1 ? 's' : ''} seleccionado{count > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-slate-600">${facility.pricePerDay.toLocaleString('es-CL')}/día</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Total</span>
            <span className="text-2xl font-extrabold" style={{ color: branding.primary }}>
              ${totalPrice.toLocaleString('es-CL')}
            </span>
          </div>
          <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-200 pt-3">
            {sortedDates.map((d) => (
              <li key={dayKey(d)}>
                <button
                  type="button"
                  onClick={() => removeDate(d)}
                  aria-label={`Quitar ${format(d, "d 'de' MMMM", { locale: es })}`}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-white"
                  style={{ backgroundColor: branding.primary }}
                >
                  {format(d, 'd MMM', { locale: es })}
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (count === 0) {
            toast.error('Selecciona al menos un día');
            return;
          }
          setShowModal(true);
        }}
        aria-disabled={count === 0}
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: count > 0 ? branding.primary : '#64748b' }}
      >
        <CalendarCheck className="h-5 w-5" aria-hidden="true" />
        {count > 0 ? `Reservar ${count} día${count > 1 ? 's' : ''}` : 'Selecciona días primero'}
      </button>
      <p className="mt-3 text-center text-xs text-slate-600">
        Se permite una sola reserva por día. Podrás pagar online o en el centro, según lo que ofrezca el centro.
      </p>

      {showModal && (
        <FacilityCheckoutModal
          spaceId={facility.id}
          spaceName={facility.name}
          capacity={facility.capacity}
          pricePerDay={facility.pricePerDay}
          dates={sortedDates.map(dayKey)}
          brandColor={branding.primary}
          user={user}
          onClose={() => setShowModal(false)}
          onBooked={() => {
            setSelectedDates([]);
            setUnavailable({});
            requested.current = new Set();
            setVisibleMonth((m) => new Date(m));
          }}
        />
      )}
    </div>
  );
};
