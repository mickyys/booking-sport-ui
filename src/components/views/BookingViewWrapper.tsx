"use client";
"use client";
'use client';

import React, { useEffect } from 'react';
import { useBookingStore } from '@/store/useBookingStore';
import { useBookingActions } from '@/hooks/useBookingActions';
import { useAuth } from '@/hooks/useAuth';
import BookingView from '@/components/views/BookingView';
import { PaymentModal } from '@/components/booking/PaymentModal';
import { AnimatePresence } from 'framer-motion';

interface Props {
  slug: string;
}

export default function BookingViewWrapper({ slug }: Props) {
  const { user } = useAuth();
  const {
    sportCenters,
    courts,
    selectedCenterId,
    setSelectedCenterId,
    fetchSportCenterBySlug,
    sportCenterBySlug,
    initialize
  } = useBookingStore();

  const {
    slots,
    handleBookSlot,
    handleConfirmBooking,
    selectedSlot,
    setSelectedSlot
  } = useBookingActions(user);

  const initialized = React.useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initialize();
    }
  }, [initialize]);

  const initializedSlug = React.useRef<string | null>(null);

  useEffect(() => {
    if (slug && sportCenterBySlug?.slug !== slug) {
      initializedSlug.current = slug;
      fetchSportCenterBySlug(slug);
    }
  }, [slug, fetchSportCenterBySlug, sportCenterBySlug]);

  return (
    <>
      <BookingView
        onBookSlot={handleBookSlot}
        user={user}
        slots={slots}
        selectedCenter={selectedCenterId}
        onCenterChange={setSelectedCenterId}
        sportCenters={sportCenters}
        courts={courts}
      />

      <AnimatePresence>
        {selectedSlot && (
          <PaymentModal
            slot={selectedSlot}
            court={courts.find(c => c.id === selectedSlot.courtId)!}
            onClose={() => setSelectedSlot(null)}
            onConfirm={handleConfirmBooking}
            user={user}
          />
        )}
      </AnimatePresence>
    </>
  );
}
