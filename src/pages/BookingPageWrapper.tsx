import React, { useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useBookingStore } from '../store/useBookingStore';
import { BookingView } from './BookingPage';

export default function BookingPageWrapper() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { handleBookSlot, user, slots } = useOutletContext<any>();
  const { sportCenters, courts, selectedCenterId, setSelectedCenterId, fetchSportCenterBySlug } = useBookingStore();

  useEffect(() => {
    if (slug) {
      fetchSportCenterBySlug(slug);
    }
  }, [slug, fetchSportCenterBySlug]);

  return (
    <BookingView
      onBookSlot={handleBookSlot}
      user={user}
      slots={slots}
      selectedCenter={selectedCenterId}
      onCenterChange={setSelectedCenterId}
      sportCenters={sportCenters}
      courts={courts}
    />
  );
}
