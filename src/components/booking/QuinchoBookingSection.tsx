"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Users, Building, CheckCircle } from 'lucide-react';
import { format, startOfToday, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { QuinchoFacility } from '@/data/facilities';
import { BrandingPalette } from '@/utils/branding';
import { createFacilityInquiry, getSpaceAvailability } from '@/api/bookingApi';
import { FacilityBookingModal } from './FacilityBookingModal';
import { useAuth } from '@/hooks/useAuth';

interface QuinchoBookingSectionProps {
  facilities: QuinchoFacility[];
  branding: BrandingPalette;
  selectedQuinchoId?: string | null;
}

interface SelectedSlot {
  quincho: QuinchoFacility;
  date: Date;
  kind: string;
  label: string;
  hours: string;
  price: number;
}

interface SpaceAvailability {
  closed: boolean;
  blocked: boolean;
  has_rules: boolean;
  franjas?: { start_time: string; end_time: string }[];
}

export const QuinchoBookingSection: React.FC<QuinchoBookingSectionProps> = ({
  facilities,
  branding,
  selectedQuinchoId,
}) => {
  const { user } = useAuth();
  const [quinchoDate, setQuinchoDate] = useState<Date>(startOfToday());
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<SelectedSlot | null>(null);
  const [availability, setAvailability] = useState<SpaceAvailability | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i)), []);

  const activeQuincho =
    facilities.find((q) => q.id === selectedQuinchoId) ?? facilities[0];

  useEffect(() => {
    if (!activeQuincho) return;
    let cancelled = false;
    getSpaceAvailability(activeQuincho.id, format(quinchoDate, 'yyyy-MM-dd'))
      .then((res) => { if (!cancelled) setAvailability(res || null); })
      .catch(() => { if (!cancelled) setAvailability(null); });
    return () => { cancelled = true; };
  }, [activeQuincho?.id, quinchoDate]);

  // Rango real: reglas configuradas (si las hay) o open/close del quincho.
  const range = useMemo(() => {
    if (availability?.has_rules && availability.franjas?.length) {
      const sorted = [...availability.franjas].sort((a, b) => a.start_time.localeCompare(b.start_time));
      return `${sorted[0].start_time} – ${sorted[sorted.length - 1].end_time}`;
    }
    const o = String(activeQuincho?.openHour || 9).padStart(2, '0') + ':00';
    const c = String(activeQuincho?.closeHour || 22).padStart(2, '0') + ':00';
    return `${o} – ${c}`;
  }, [availability, activeQuincho]);

  // Disponible: solo no disponible si hay reglas configuradas y el día está
  // cerrado (excepción) o bloqueado. Sin reglas (legacy) se asume disponible.
  const isAvailable = !availability || (!availability.closed && !availability.blocked);

  const slots = useMemo(() => {
    const base = [{ kind: 'allday', label: 'Día Completo', hours: range, price: activeQuincho?.priceAllDay || 0 }];
    if (activeQuincho && activeQuincho.priceHalfDay > 0) {
      base.push({ kind: 'halfday', label: 'Media jornada', hours: range, price: activeQuincho.priceHalfDay });
    }
    return base;
  }, [range, activeQuincho]);

  const handleSlotClick = (quincho: QuinchoFacility, kind: string, label: string, hours: string, price: number) => {
    setSelectedSlotInfo({ quincho, date: quinchoDate, kind, label, hours, price });
  };

  return (
    <div>
      {activeQuincho && (
        <>
          <div className="flex flex-col sm:flex-row gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
            <img
              src={activeQuincho.image}
              alt={activeQuincho.name}
              className="w-full sm:w-48 h-40 sm:h-auto rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{activeQuincho.name}</h3>
              <p className="text-sm text-slate-600 mb-3 leading-relaxed">{activeQuincho.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
                  <Users className="w-3.5 h-3.5" />
                  {activeQuincho.capacity} personas
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
                  <Building className="w-3.5 h-3.5" />
                  {activeQuincho.area}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeQuincho.features.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 bg-white border border-slate-100 rounded-lg px-2 py-1"
                  >
                    <CheckCircle className="w-3 h-3" style={{ color: branding.primary }} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-700 mb-3">Selecciona el día</p>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
            {days.map((day) => {
              const isSelected = format(day, 'yyyy-MM-dd') === format(quinchoDate, 'yyyy-MM-dd');
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setQuinchoDate(day)}
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

          <p className="text-sm font-semibold text-slate-700 mb-3">
            Disponibilidad para {format(quinchoDate, "d 'de' MMMM", { locale: es })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {slots.map(({ kind, label, hours, price }) => (
              <motion.button
                key={kind}
                onClick={() => isAvailable && handleSlotClick(activeQuincho, kind, label, hours, price)}
                whileHover={isAvailable ? { scale: 1.02 } : {}}
                whileTap={isAvailable ? { scale: 0.97 } : {}}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  isAvailable ? 'bg-white cursor-pointer hover:shadow-md' : 'bg-slate-50 cursor-not-allowed opacity-60'
                }`}
                style={{ borderColor: isAvailable ? `${branding.primary}40` : '#e2e8f0' }}
                onMouseEnter={(e) => {
                  if (isAvailable)
                    (e.currentTarget as HTMLButtonElement).style.borderColor = branding.primary;
                }}
                onMouseLeave={(e) => {
                  if (isAvailable)
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${branding.primary}40`;
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-slate-900">{label}</p>
                  {isAvailable ? (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${branding.primary}18`, color: branding.primary }}
                    >
                      Disponible
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Reservado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">{hours}</p>
                <p className="text-xl font-extrabold" style={{ color: isAvailable ? branding.primary : '#94a3b8' }}>
                  ${price.toLocaleString('es-CL')}
                </p>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {selectedSlotInfo && (
        <FacilityBookingModal
          title="Reservar Quincho"
          variant="booking"
          user={user}
          subtitle={selectedSlotInfo.quincho.name}
          brandColor={branding.primary}
          summary={{
            label: `${selectedSlotInfo.label} • ${format(selectedSlotInfo.date, "EEEE d 'de' MMMM", { locale: es })}`,
            value: `$${selectedSlotInfo.price.toLocaleString('es-CL')}`,
          }}
          onClose={() => setSelectedSlotInfo(null)}
          onSubmit={async (details) => {
            await createFacilityInquiry({
              facility_id: selectedSlotInfo.quincho.id,
              contact_name: user?.name || details.name,
              contact_email: user?.email || details.email,
              contact_phone: details.phone,
              message: details.message,
              date: format(selectedSlotInfo.date, 'yyyy-MM-dd'),
              slot_kind: selectedSlotInfo.kind,
              total_price: selectedSlotInfo.price,
            });
          }}
        />
      )}
    </div>
  );
};

export default QuinchoBookingSection;