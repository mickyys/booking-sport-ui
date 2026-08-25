"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Users, Building, CheckCircle, X, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import { MonthlyFacility } from '@/data/facilities';
import { BrandingPalette } from '@/utils/branding';
import { createFacilityInquiry, getSpaceAvailabilityRange } from '@/api/bookingApi';
import { FacilityBookingModal } from './FacilityBookingModal';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface MonthlyFacilityBookingSectionProps {
  facility: MonthlyFacility;
  branding: BrandingPalette;
}

export const MonthlyFacilityBookingSection: React.FC<MonthlyFacilityBookingSectionProps> = ({
  facility,
  branding,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [unavailableByDate, setUnavailableByDate] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedMonth === null) return;
    const currentMonth = new Date().getMonth();
    const year = selectedMonth < currentMonth ? new Date().getFullYear() + 1 : new Date().getFullYear();
    const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
    const from = `${year}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const to = `${year}-${String(selectedMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    let cancelled = false;
    getSpaceAvailabilityRange(facility.id, from, to)
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, boolean> = {};
        Object.entries(res || {}).forEach(([date, a]) => {
          map[date] = !!(a?.closed || a?.blocked);
        });
        setUnavailableByDate(map);
      })
      .catch(() => {
        if (!cancelled) setUnavailableByDate({});
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, facility.id]);

  const calendar = useMemo(() => {
    if (selectedMonth === null) return null;
    const currentMonth = new Date().getMonth();
    const year = selectedMonth < currentMonth ? new Date().getFullYear() + 1 : new Date().getFullYear();
    const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
    const rawFirstDay = new Date(year, selectedMonth, 1).getDay();
    const offset = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
    const unavailableDays = new Set<number>();
    Object.entries(unavailableByDate).forEach(([date, unav]) => {
      if (!unav) return;
      const day = parseInt(date.slice(-2), 10);
      if (!Number.isNaN(day) && day >= 1 && day <= daysInMonth) unavailableDays.add(day);
    });
    return { daysInMonth, offset, unavailableDays, year };
  }, [selectedMonth, unavailableByDate]);

  const totalPrice = selectedDays.length * facility.pricePerDay;

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setSelectedDays([]);
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div>
      {/* Facility hero */}
      <div className="relative rounded-2xl overflow-hidden mb-5 h-44">
        <img src={facility.image} alt={facility.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(15,23,42,0.88))' }} />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white">{facility.name}</h3>
          <div className="flex gap-3 mt-1">
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <Users className="w-3.5 h-3.5" />{facility.capacity} personas
            </span>
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <Building className="w-3.5 h-3.5" />{facility.area}
            </span>
            <span className="flex items-center gap-1 text-white/80 text-xs font-bold">
              ${facility.pricePerDay.toLocaleString('es-CL')}/día
            </span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-6">
        {facility.features.map((f) => (
          <div key={f} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: branding.primary }} />
            <span className="text-xs text-slate-700">{f}</span>
          </div>
        ))}
      </div>

      {/* Step 1: month */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-800">
            {selectedMonth === null ? '1. Selecciona un mes' : '1. Mes seleccionado'}
          </p>
          {selectedMonth !== null && (
            <button
              onClick={() => { setSelectedMonth(null); setSelectedDays([]); }}
              className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" /> Cambiar mes
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }, (_, m) => {
            const isAvailable = facility.availableMonths.includes(m);
            const isSelected = selectedMonth === m;
            return (
              <button
                key={m}
                onClick={() => isAvailable && handleMonthSelect(m)}
                disabled={!isAvailable}
                className="py-2.5 rounded-xl text-xs font-semibold text-center transition-all"
                style={{
                  backgroundColor: isSelected ? branding.primary : isAvailable ? 'white' : '#f8fafc',
                  color: isSelected ? 'white' : isAvailable ? '#334155' : '#cbd5e1',
                  border: `2px solid ${isSelected ? branding.primary : isAvailable ? '#e2e8f0' : '#f1f5f9'}`,
                  textDecoration: isAvailable ? 'none' : 'line-through',
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                }}
              >
                {MONTH_NAMES[m].slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: days */}
      {selectedMonth !== null && calendar && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-800">
              2. Selecciona los días en {MONTH_NAMES[selectedMonth]}
            </p>
            {selectedDays.length > 0 && (
              <button
                onClick={() => setSelectedDays([])}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: calendar.offset }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: calendar.daysInMonth }, (_, i) => {
              const day = i + 1;
              const isUnavailable = calendar.unavailableDays.has(day);
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => !isUnavailable && handleDayToggle(day)}
                  disabled={isUnavailable}
                  className="aspect-square rounded-lg text-xs font-semibold flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isSelected ? branding.primary : isUnavailable ? '#f1f5f9' : 'white',
                    color: isSelected ? 'white' : isUnavailable ? '#cbd5e1' : '#334155',
                    border: `1.5px solid ${isSelected ? branding.primary : isUnavailable ? '#f1f5f9' : '#e2e8f0'}`,
                    cursor: isUnavailable ? 'not-allowed' : 'pointer',
                    textDecoration: isUnavailable ? 'line-through' : 'none',
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Días tachados = cerrados o bloqueados por el recinto. Puedes seleccionar días no consecutivos.
          </p>
        </div>
      )}

      {/* Summary */}
      {selectedDays.length > 0 && (
        <div className="p-4 rounded-2xl border-2 mb-4" style={{ borderColor: `${branding.primary}40`, backgroundColor: `${branding.primary}08` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">
              {selectedDays.length} día{selectedDays.length > 1 ? 's' : ''} seleccionado{selectedDays.length > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-slate-500">
              ${facility.pricePerDay.toLocaleString('es-CL')}/día
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Total</span>
            <span className="text-2xl font-extrabold" style={{ color: branding.primary }}>
              ${totalPrice.toLocaleString('es-CL')}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-200">
            {[...selectedDays].sort((a, b) => a - b).map((d) => (
              <span
                key={d}
                className="px-2 py-0.5 text-xs font-semibold rounded-full text-white"
                style={{ backgroundColor: branding.primary }}
              >
                {d} {MONTH_NAMES[selectedMonth!].slice(0, 3)}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (selectedDays.length === 0) {
            toast.error('Selecciona al menos un día');
            return;
          }
          setShowModal(true);
        }}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95"
        style={{ backgroundColor: selectedDays.length > 0 ? branding.primary : '#94a3b8' }}
      >
        <PhoneCall className="w-5 h-5" />
        {selectedDays.length > 0
          ? `Solicitar ${selectedDays.length} día${selectedDays.length > 1 ? 's' : ''}`
          : 'Selecciona días primero'}
      </button>
      <p className="text-xs text-slate-400 text-center mt-3">
        Te contactaremos para confirmar disponibilidad en menos de 24 horas.
      </p>

      {showModal && (
        <FacilityBookingModal
          title={`Solicitar Arriendo — ${facility.name}`}
          subtitle={`${selectedDays.length} día${selectedDays.length > 1 ? 's' : ''} en ${MONTH_NAMES[selectedMonth!]}`}
          brandColor={branding.primary}
          summary={{
            label: 'Total estimado',
            value: `$${totalPrice.toLocaleString('es-CL')}`,
          }}
          onClose={() => setShowModal(false)}
          onSubmit={async (details) => {
            await createFacilityInquiry({
              facility_id: facility.id,
              contact_name: details.name,
              contact_email: details.email,
              contact_phone: details.phone,
              message: details.message,
              month: selectedMonth!,
              days: selectedDays,
              total_price: totalPrice,
            });
          }}
        />
      )}
    </div>
  );
};

export default MonthlyFacilityBookingSection;