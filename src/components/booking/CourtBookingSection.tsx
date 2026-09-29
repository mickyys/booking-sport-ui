"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Grid, List, CreditCard, Loader2 } from 'lucide-react';
import { format, startOfToday, addDays, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { TimeSlot, Court } from '@/types';
import { useBookingStore } from '@/store/useBookingStore';
import { BrandingPalette } from '@/utils/branding';

interface CourtBookingSectionProps {
  centerId: string;
  courts: Court[];
  branding: BrandingPalette;
  onBookSlot: (slot: TimeSlot) => void;
  selectedCourtId?: string | null;
}

export const CourtBookingSection: React.FC<CourtBookingSectionProps> = ({
  centerId,
  courts,
  branding,
  onBookSlot,
  selectedCourtId,
}) => {
  const { schedules, isLoading, fetchSchedules } = useBookingStore();
  const [selectedDay, setSelectedDay] = useState<Date>(startOfToday());
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const courtsForCenter = useMemo(() => {
    const fromProp = courts.filter((c) => c.centerId === centerId);
    if (fromProp.length > 0) return fromProp;
    // Fallback: derivar canchas desde los schedules reales del centro
    return schedules.map((cs: any) => ({
      id: cs.id,
      name: cs.name || 'Cancha',
      shortName: cs.name?.split(' ')[0] || 'Cancha',
      type: cs.type || '',
      image: '',
      centerId,
    }));
  }, [courts, centerId, schedules]);

  const activeCourtId =
    selectedCourtId && courtsForCenter.some((c) => c.id === selectedCourtId)
      ? selectedCourtId
      : (courtsForCenter[0]?.id ?? null);

  // Sin guard local: cada cambio de día dispara la petición y el store
  // descarta las respuestas obsoletas (última petición gana).
  useEffect(() => {
    if (!centerId) return;
    const formattedDate = format(selectedDay, 'yyyy-MM-dd');
    fetchSchedules(centerId, formattedDate);
  }, [centerId, selectedDay, fetchSchedules]);

  const apiSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    schedules.forEach((courtSchedule: any) => {
      (courtSchedule.schedule || []).forEach((slot: any) => {
        const date = setMinutes(setHours(selectedDay, slot.hour), slot.minutes || 0);
        let status = slot.status;
        if (date < new Date() && status === 'available') status = 'passed';
        slots.push({
          id: `${courtSchedule.id}-${format(date, 'yyyy-MM-dd')}-${slot.hour}-${slot.minutes || 0}`,
          courtId: courtSchedule.id,
          centerId,
          date,
          hour: slot.hour,
          minutes: slot.minutes || 0,
          status,
          price: slot.price,
          paymentRequired: slot.paymentRequired,
          paymentOptional: slot.paymentOptional,
          partialPaymentEnabled: slot.partialPaymentEnabled,
        });
      });
    });
    return slots;
  }, [schedules, selectedDay, centerId]);

  const filteredSlots = useMemo(
    () => apiSlots.filter((s) => s.courtId === activeCourtId),
    [apiSlots, activeCourtId]
  );

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i)), []);
  const hours = Array.from({ length: 18 }, (_, i) => 6 + i);

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status !== 'available') return;
    onBookSlot(slot);
  };

  const statusLabel = (slot: TimeSlot) =>
    slot.status === 'available'
      ? 'Disponible'
      : slot.status === 'passed'
        ? 'No disponible'
        : 'Reservado';

  return (
    <div>
      {/* View mode toggle */}
      {courtsForCenter.length > 1 && (
        <div className="flex justify-end mb-5">
          <div className="bg-slate-100 p-1 rounded-xl inline-flex">
            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'single' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              style={viewMode === 'single' ? { color: branding.primary } : {}}
            >
              <Grid className="w-4 h-4" />
              Por Cancha
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'all' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              style={viewMode === 'all' ? { color: branding.primary } : {}}
            >
              <List className="w-4 h-4" />
              Ver Todo
            </button>
          </div>
        </div>
      )}

      {/* Date pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {days.map((day) => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className="flex-shrink-0 flex flex-col items-center justify-center min-w-[72px] h-20 rounded-2xl border-2 transition-all"
              style={{
                backgroundColor: isSelected ? branding.navBg : 'white',
                borderColor: isSelected ? branding.primary : '#e2e8f0',
                color: isSelected ? 'white' : '#475569',
              }}
            >
              <span className="text-xs uppercase font-bold tracking-wider mb-1">
                {format(day, 'EEE', { locale: es })}
              </span>
              <span className="text-xl font-bold">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: branding.primary }} />
          <p className="text-slate-500 font-medium animate-pulse">Buscando horarios disponibles...</p>
        </div>
      ) : viewMode === 'single' ? (
        <>
          <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.primary }} />
            {courtsForCenter.find((c) => c.id === activeCourtId)?.name || 'Cancha'}
          </p>

          {/* Slot grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredSlots.map((slot) => {
              const isAvailable = slot.status === 'available';
              return (
                <motion.button
                  key={slot.id}
                  onClick={() => isAvailable && handleSlotClick(slot)}
                  whileHover={isAvailable ? { scale: 1.02 } : {}}
                  whileTap={isAvailable ? { scale: 0.97 } : {}}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isAvailable
                      ? 'bg-white border-slate-200 cursor-pointer hover:shadow-md'
                      : 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-50'
                  }`}
                  style={isAvailable ? { borderColor: 'transparent' } : {}}
                  onMouseEnter={(e) => {
                    if (isAvailable)
                      (e.currentTarget as HTMLButtonElement).style.borderColor = branding.primary;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                  }}
                >
                  <p className="text-xl font-bold text-slate-900 mb-1">{format(slot.date, 'HH:mm')}</p>
                  <p className="text-xs text-slate-500 mb-2">
                    {courtsForCenter.find((c) => c.id === slot.courtId)?.shortName || 'Cancha'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: isAvailable ? branding.primary : '#94a3b8' }}>
                      ${slot.price.toLocaleString('es-CL')}
                    </span>
                    {!isAvailable && <span className="text-xs text-slate-400">✗</span>}
                  </div>
                  {(slot.paymentRequired || slot.paymentOptional) && (
                    <div className="mt-2">
                      {slot.paymentRequired && (
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-100">
                          <CreditCard className="w-3 h-3" /> Pago requerido
                        </span>
                      )}
                      {!slot.paymentRequired && slot.paymentOptional && (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-100">
                          <CreditCard className="w-3 h-3" /> Pago opcional
                        </span>
                      )}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {filteredSlots.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No hay horarios disponibles para esta fecha.</p>
            </div>
          )}
        </>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-center">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-500 font-medium w-24">Horario</th>
                {courtsForCenter.map((court) => (
                  <th key={court.id} className="p-4 text-slate-900 font-bold min-w-[160px]">
                    {court.shortName}
                    <div className="text-xs font-normal text-slate-500">{court.type}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hours.map((hour) => (
                <tr key={hour} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono font-medium text-slate-500 border-r border-slate-100">
                    {hour}:00
                  </td>
                  {courtsForCenter.map((court) => {
                    const slot = apiSlots.find(
                      (s) => s.courtId === court.id && s.date.getHours() === hour
                    );
                    const isAvailable = slot?.status === 'available';
                    return (
                      <td key={`${court.id}-${hour}`} className="p-2">
                        {slot ? (
                          <button
                            onClick={() => slot && handleSlotClick(slot)}
                            disabled={!isAvailable}
                            className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                              isAvailable
                                ? 'hover:text-white hover:shadow-md'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            style={
                              isAvailable
                                ? {
                                    backgroundColor: `${branding.primary}18`,
                                    color: branding.primary,
                                  }
                                : {}
                            }
                          >
                            {isAvailable ? 'Disponible' : statusLabel(slot)}
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CourtBookingSection;