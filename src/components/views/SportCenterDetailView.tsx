"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Trophy, Clock, CheckCircle, Phone, Mail, ChevronRight,
  Loader2, X, Navigation, ChevronLeft, CalendarDays, MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from '@/hooks/useAuth';
import { useBookingActions } from '@/hooks/useBookingActions';
import { resolveBranding } from '@/utils/branding';
import { buildFacilityCatalog } from '@/data/facilities';
import { Court } from '@/types';
import { CourtBookingSection } from '@/components/booking/CourtBookingSection';
import { QuinchoBookingSection } from '@/components/booking/QuinchoBookingSection';
import { MonthlyFacilityBookingSection } from '@/components/booking/MonthlyFacilityBookingSection';
import { PaymentModal } from '@/components/booking/PaymentModal';
import { NearbyCentersMap } from '@/components/sport-center/NearbyCentersMap';
import { googleMapsDirectionsUrl, googleMapsPlaceUrl } from '@/utils/geo';
import { getWhatsappUrl } from '@/utils/contact';
import { ShareButton } from '@/components/sport-center/ShareButton';
import { SpaceSelector, SpaceOption } from '@/components/sport-center/SpaceSelector';
import { CancellationPolicyCard } from '@/components/sport-center/CancellationPolicyCard';
import { GoogleReviewsCard, GoogleRatingChip, useGoogleReviews } from '@/components/sport-center/GoogleReviewsCard';

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
    () =>
      courts
        .filter((c) => c.centerId === centerId)
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true })),
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

  const selectSpace = (space: SpaceOption) => setSelectedSpaceId(space.id);

  const reviews = useGoogleReviews(slug, !!center?.googlePlaceId);

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
  const fullAddress = [center.address, center.city].filter(Boolean).join(', ');
  const phone = center.contact?.phone || center.phone;
  const email = center.contact?.email || center.email;
  const whatsappUrl = phone ? getWhatsappUrl(phone, `Hola, quiero consultar por ${center.name}`) : '';
  const mapsTarget = {
    name: center.name,
    address: center.address,
    city: center.city,
    coordinates: center.coordinates,
  };
  const actionClass =
    'flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]';
  const iconBadge = { backgroundColor: branding.primary + '22', color: branding.primary };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0">
      {/* Hero */}
      <header className="relative h-60 overflow-hidden md:h-80">
        <img src={center.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: branding.heroGradient }} />

        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
          <Link
            href="/"
            aria-label="Volver a los centros deportivos"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <ShareButton
            kind="page"
            title={center.name}
            text={`Reserva en ${center.name}`}
            label="Compartir"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black/40 px-4 text-sm font-semibold text-white backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-2 text-2xl font-extrabold text-white drop-shadow md:text-4xl">{center.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/90">
              {reviews && <GoogleRatingChip data={reviews} />}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {center.city || center.address}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {scheduleStart} – {scheduleEnd}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
        {/* Acciones rápidas */}
        <nav aria-label="Acciones rápidas" className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <a href={googleMapsDirectionsUrl(mapsTarget)} target="_blank" rel="noopener noreferrer" className={actionClass}>
            <Navigation className="h-4 w-4" style={{ color: branding.primary }} aria-hidden="true" />
            Cómo llegar
          </a>
          {phone ? (
            <a href={`tel:${phone}`} className={actionClass}>
              <Phone className="h-4 w-4" style={{ color: branding.primary }} aria-hidden="true" />
              Llamar
            </a>
          ) : (
            <a href="#reservar" className={actionClass}>
              <CalendarDays className="h-4 w-4" style={{ color: branding.primary }} aria-hidden="true" />
              Reservar
            </a>
          )}
          <ShareButton
            kind="page"
            title={center.name}
            text={`Reserva en ${center.name}`}
            label="Compartir reservas"
            className={actionClass}
          />
          <ShareButton
            kind="location"
            title={center.name}
            text={`${center.name} · ${fullAddress}`}
            url={googleMapsPlaceUrl(mapsTarget)}
            label="Compartir ubicación"
            className={actionClass}
          />
        </nav>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-5 lg:col-span-2">
            {allSpaces.length > 0 && (
              <section aria-labelledby="espacios-titulo" className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 id="espacios-titulo" className="mb-4 text-lg font-bold text-slate-900">Canchas y espacios</h2>
                <SpaceSelector spaces={allSpaces} selectedId={selectedSpaceId} onSelect={selectSpace} branding={branding} />
              </section>
            )}

            <section id="reservar" aria-labelledby="reservar-titulo" className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 id="reservar-titulo" className="mb-1 text-lg font-bold text-slate-900">
                Reservar{selectedSpace ? ` · ${selectedSpace.name}` : ''}
              </h2>
              <p className="mb-5 text-sm text-slate-600">
                {activeCategory === 'sede' || activeCategory === 'piscina'
                  ? 'Elige los días que quieres arrendar (hasta 1 año).'
                  : 'Elige el día y el horario.'}
              </p>

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

              {allSpaces.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-600">
                  Este centro aún no tiene espacios disponibles para reservar.
                </p>
              )}
            </section>

            <CancellationPolicyCard center={center} branding={branding} />

            {reviews && <GoogleReviewsCard data={reviews} />}

            {services.length > 0 && (
              <section aria-labelledby="servicios-titulo" className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 id="servicios-titulo" className="mb-3 text-lg font-bold text-slate-900">Servicios</h2>
                <ul className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <li
                      key={s}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-sm font-medium text-slate-800"
                    >
                      <CheckCircle className="h-4 w-4" style={{ color: branding.primary }} aria-hidden="true" />
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Contacto y ubicación */}
          <aside className="space-y-5">
            <section aria-labelledby="contacto-titulo" className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20">
              <h2 id="contacto-titulo" className="mb-4 text-lg font-bold text-slate-900">Contacto y ubicación</h2>
              <ul className="space-y-3 text-sm text-slate-700">
                {phone && (
                  <li>
                    <a href={`tel:${phone}`} className="flex min-h-11 items-center gap-3 no-underline hover:text-slate-900">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={iconBadge}>
                        <Phone className="h-4 w-4" aria-hidden="true" />
                      </span>
                      {phone}
                    </a>
                  </li>
                )}
                {email && (
                  <li>
                    <a href={`mailto:${email}`} className="flex min-h-11 items-center gap-3 break-all no-underline hover:text-slate-900">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={iconBadge}>
                        <Mail className="h-4 w-4" aria-hidden="true" />
                      </span>
                      {email}
                    </a>
                  </li>
                )}
                <li className="flex min-h-11 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={iconBadge}>
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>{fullAddress}</span>
                </li>
              </ul>

              <div className="mt-4">
                <NearbyCentersMap center={center} />
                <a
                  href={googleMapsDirectionsUrl(mapsTarget)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white no-underline transition-opacity hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: branding.primary }}
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Cómo llegar
                </a>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold text-white no-underline transition-opacity hover:opacity-90 active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Escribir por WhatsApp
                  </a>
                )}
              </div>

              <Link
                href="/"
                className="mt-4 flex min-h-11 items-center gap-2 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-700 no-underline hover:text-slate-900"
              >
                <Trophy className="h-4 w-4" style={{ color: branding.primary }} aria-hidden="true" />
                Ver otros centros deportivos
                <ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" />
              </Link>
            </section>
          </aside>
        </div>
      </main>

      {/* CTA fijo en móvil */}
      {allSpaces.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
          <a
            href="#reservar"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white no-underline active:scale-[0.98]"
            style={{ backgroundColor: branding.primary }}
          >
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
            {selectedSpace ? `Reservar ${selectedSpace.name}` : 'Reservar'}
          </a>
        </div>
      )}

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