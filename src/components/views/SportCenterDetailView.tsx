"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Star, Trophy, Clock, CheckCircle, Phone, Mail, ChevronRight,
  ChevronDown, ChevronUp, Users, Building, Loader2, X, CalendarDays,
  Trees, Waves, Check, Navigation,
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from '@/hooks/useAuth';
import { useBookingActions } from '@/hooks/useBookingActions';
import { resolveBranding } from '@/utils/branding';
import { buildFacilityCatalog } from '@/data/facilities';
import { Court, SpaceCategory } from '@/types';
import { CourtBookingSection } from '@/components/booking/CourtBookingSection';
import { QuinchoBookingSection } from '@/components/booking/QuinchoBookingSection';
import { MonthlyFacilityBookingSection } from '@/components/booking/MonthlyFacilityBookingSection';
import { PaymentModal } from '@/components/booking/PaymentModal';
import { NearbyCentersMap } from '@/components/sport-center/NearbyCentersMap';
import { googleMapsDirectionsUrl } from '@/utils/geo';

interface SpaceOption {
  id: string;
  category: SpaceCategory;
  name: string;
  image?: string;
  subLabel?: string;
}

const CATEGORY_META: Record<SpaceCategory, { label: string; icon: React.ReactNode; classes: string }> = {
  cancha: { label: 'Cancha', icon: <Trophy className="w-4 h-4" />, classes: 'bg-emerald-100 text-emerald-700' },
  quincho: { label: 'Quincho', icon: <Trees className="w-4 h-4" />, classes: 'bg-amber-100 text-amber-700' },
  sede: { label: 'Sede', icon: <Building className="w-4 h-4" />, classes: 'bg-indigo-100 text-indigo-700' },
  piscina: { label: 'Piscina', icon: <Waves className="w-4 h-4" />, classes: 'bg-sky-100 text-sky-700' },
};

interface SportCenterDetailViewProps {
  slug: string;
}

export const SportCenterDetailView: React.FC<SportCenterDetailViewProps> = ({ slug }) => {
  const { user } = useAuth();
  const {
    sportCenterBySlug: center,
    courts,
    schedules,
    isLoading,
    facilitiesBySlug,
    fetchSportCenterBySlug,
    fetchCourts,
  } = useBookingStore();

  const {
    selectedSlot,
    handleBookSlot,
    handleConfirmBooking,
    setSelectedSlot,
  } = useBookingActions(user);

  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);

  useEffect(() => {
    if (slug) fetchSportCenterBySlug(slug);
  }, [slug, fetchSportCenterBySlug]);

  useEffect(() => {
    if (courts.length === 0) fetchCourts();
  }, [courts.length, fetchCourts]);

  const branding = useMemo(() => resolveBranding(center?.branding), [center?.branding]);

  // Facilities cacheadas por slug en el store (llegan con fetchSportCenterBySlug).
  const facilities = useMemo(
    () => buildFacilityCatalog(facilitiesBySlug[slug]),
    [facilitiesBySlug, slug]
  );

  const centerId = center?.id || '';
  const courtsForCenter = useMemo(
    () => courts.filter((c) => c.centerId === centerId),
    [courts, centerId]
  );

  const allSpaces = useMemo<SpaceOption[]>(() => {
    const spaces: SpaceOption[] = [
      ...courtsForCenter.map((c) => ({
        id: c.id,
        category: 'cancha' as const,
        name: c.name,
        image: c.image_url || c.image || '',
        subLabel: c.type || undefined,
      })),
      ...facilities.quinchos.map((q) => ({
        id: q.id,
        category: 'quincho' as const,
        name: q.name,
        image: q.image,
        subLabel: `${q.capacity} personas`,
      })),
      ...facilities.monthlyFacilities.map((m) => ({
        id: m.id,
        category: m.type,
        name: m.name,
        image: m.image,
        subLabel: `$${m.pricePerDay.toLocaleString('es-CL')}/día`,
      })),
    ];
    return spaces;
  }, [courtsForCenter, facilities]);

  useEffect(() => {
    if (allSpaces.length === 0) return;
    setSelectedSpaceId((prev) => (prev && allSpaces.some((s) => s.id === prev) ? prev : allSpaces[0].id));
  }, [allSpaces]);

  const selectedSpace = useMemo(
    () => allSpaces.find((s) => s.id === selectedSpaceId) || allSpaces[0],
    [allSpaces, selectedSpaceId]
  );
  const activeCategory = selectedSpace?.category;

  const selectedMonthlyFacility = useMemo(
    () => facilities.monthlyFacilities.find((f) => f.id === selectedSpaceId),
    [facilities, selectedSpaceId]
  );

  const selectSpace = (space: SpaceOption) => {
    setSelectedSpaceId(space.id);
    document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading && !center) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: branding.primary }} />
        <p className="text-slate-500 font-medium animate-pulse">Cargando centro deportivo...</p>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Centro no encontrado</h1>
          <p className="text-slate-500 mb-6">No existe un centro deportivo con ese identificador.</p>
          <Link href="/" className="inline-flex items-center gap-2 font-bold hover:underline no-underline" style={{ color: branding.primary }}>
            <X className="w-4 h-4" />
            Volver al Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const services = center.services || [];
  const scheduleStart = center.default_schedule?.start_time || '09:00';
  const scheduleEnd = center.default_schedule?.end_time || '23:00';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-[340px] md:h-[420px] overflow-hidden">
        <img
          src={center.image}
          alt={center.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: branding.heroGradient }} />

        {center.cancellationHours !== undefined && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
            <div
              className="text-center py-2.5 px-6 rounded-full text-sm font-semibold text-white backdrop-blur-sm mx-auto w-fit"
              style={{ backgroundColor: branding.primary + 'cc' }}
            >
              Cancelación gratis hasta {center.cancellationHours} hora{center.cancellationHours !== 1 ? 's' : ''} antes
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">{center.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                {courtsForCenter.length || center.courts || 0} canchas
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {[center.city, center.address].filter(Boolean).join(' · ')}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {scheduleStart} – {scheduleEnd}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Sobre {center.name}</h2>
              <p className="text-slate-600 leading-relaxed">
                {[center.city, center.address].filter(Boolean).join(', ')}.{' '}
                Reserva tu cancha en línea y paga de forma segura con Mercado Pago.
              </p>
            </div>

            {/* Services */}
            {services.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Servicios incluidos</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(showAllServices ? services : services.slice(0, 4)).map((s) => (
                    <div
                      key={s}
                      className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                        style={{ backgroundColor: branding.primary + '22', color: branding.primary }}
                      >
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{s}</span>
                    </div>
                  ))}
                </div>
                {services.length > 4 && (
                  <button
                    onClick={() => setShowAllServices(!showAllServices)}
                    className="mt-4 flex items-center gap-1.5 text-sm font-medium transition-colors"
                    style={{ color: branding.primary }}
                  >
                    {showAllServices ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showAllServices ? 'Ver menos' : `Ver ${services.length - 4} servicios más`}
                  </button>
                )}
              </div>
            )}

            {/* Spaces */}
            {allSpaces.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-5">Nuestros Espacios</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {allSpaces.map((space) => {
                    const meta = CATEGORY_META[space.category];
                    return (
                      <button
                        key={space.id}
                        onClick={() => selectSpace(space)}
                        className="group flex flex-col items-center text-center p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                      >
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${meta.classes}`}>
                          {meta.icon}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 leading-tight">{space.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Booking section with space selector */}
            <div id="reservar" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Reservar</h2>

              {allSpaces.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
                  {allSpaces.map((space) => {
                    const isSelected = space.id === selectedSpaceId;
                    const meta = CATEGORY_META[space.category];
                    return (
                      <button
                        key={space.id}
                        onClick={() => setSelectedSpaceId(space.id)}
                        className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[92px] px-3 py-3 rounded-2xl border-2 transition-all cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? `${branding.primary}0f` : 'white',
                          borderColor: isSelected ? branding.primary : '#e2e8f0',
                        }}
                      >
                        <span className="relative">
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center ${meta.classes}`}>
                            {meta.icon}
                          </span>
                          {isSelected && (
                            <span
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
                              style={{ backgroundColor: branding.primary }}
                            >
                              <Check className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </span>
                        <span className="text-xs font-bold text-slate-800 leading-tight text-center">{space.name}</span>
                        <span className="text-[10px] text-slate-400">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeCategory === 'cancha' && (
                <CourtBookingSection
                  centerId={centerId}
                  courts={courts}
                  branding={branding}
                  onBookSlot={handleBookSlot}
                  selectedCourtId={selectedSpaceId}
                />
              )}

              {activeCategory === 'quincho' && (
                <QuinchoBookingSection
                  facilities={facilities.quinchos}
                  branding={branding}
                  selectedQuinchoId={selectedSpaceId}
                />
              )}

              {selectedMonthlyFacility && (activeCategory === 'sede' || activeCategory === 'piscina') && (
                <MonthlyFacilityBookingSection facility={selectedMonthlyFacility} branding={branding} />
              )}
            </div>
          </div>

          {/* Right column — sticky sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-20">
              <h3 className="font-bold text-slate-900 mb-1 text-lg">Reserva tu Cancha</h3>
              <p className="text-slate-500 text-sm mb-5">Elige tu horario en la sección de reservas</p>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-5">
                <div>
                  <p className="text-xs text-slate-500">Canchas</p>
                  <p className="text-2xl font-extrabold text-slate-900">{courtsForCenter.length || center.courts || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Horario</p>
                  <p className="text-sm font-semibold text-slate-700">{scheduleStart} – {scheduleEnd}</p>
                </div>
              </div>

              <a
                href="#reservar"
                className="block w-full text-center py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95 no-underline"
                style={{ backgroundColor: branding.primary }}
              >
                Ver disponibilidad
              </a>

              {center.cancellationHours !== undefined && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Cancelación gratis hasta {center.cancellationHours} hora{center.cancellationHours !== 1 ? 's' : ''} antes del partido
                  </p>
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Contacto</h3>
              <div className="space-y-3">
                {center.phone && (
                  <a href={`tel:${center.phone}`} className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors text-sm no-underline">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: branding.primary + '22', color: branding.primary }}>
                      <Phone className="w-4 h-4" />
                    </div>
                    {center.phone}
                  </a>
                )}
                {center.email && (
                  <a href={`mailto:${center.email}`} className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors text-sm no-underline">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: branding.primary + '22', color: branding.primary }}>
                      <Mail className="w-4 h-4" />
                    </div>
                    {center.email}
                  </a>
                )}
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: branding.primary + '22', color: branding.primary }}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>{[center.city, center.address].filter(Boolean).join(', ')}</span>
                </div>
              </div>

              <div className="mt-4">
                <NearbyCentersMap center={center} />
                <a
                  href={googleMapsDirectionsUrl({
                    name: center.name,
                    address: center.address,
                    city: center.city,
                    coordinates: center.coordinates,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95 no-underline"
                  style={{ backgroundColor: branding.primary }}
                >
                  <Navigation className="w-4 h-4" />
                  Cómo llegar
                </a>
              </div>
            </div>

            {/* Marketplace link */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <p className="text-xs text-slate-500 mb-2">¿Buscas otra cancha?</p>
              <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 no-underline">
                <Trophy className="w-4 h-4" style={{ color: branding.primary }} />
                Ver todos los centros deportivos
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Payment modal (real flow) */}
      <AnimatePresence>
        {selectedSlot &&
          (() => {
            const fromSchedule = schedules.find((cs) => cs.id === selectedSlot.courtId);
            const court: Court =
              courts.find((c) => c.id === selectedSlot.courtId) ||
              (fromSchedule
                ? {
                    id: fromSchedule.id,
                    name: fromSchedule.name,
                    shortName: fromSchedule.name?.split(' ')[0] || 'Cancha',
                    type: '',
                    image: center.image,
                    centerId,
                  }
                : {
                    id: selectedSlot.courtId,
                    name: 'Cancha',
                    shortName: 'Cancha',
                    type: '',
                    image: center.image,
                    centerId,
                  });
            return (
              <PaymentModal
                slot={selectedSlot}
                court={court}
                onClose={() => setSelectedSlot(null)}
                onConfirm={handleConfirmBooking}
                user={user}
              />
            );
          })()}
      </AnimatePresence>
    </div>
  );
};

export default SportCenterDetailView;