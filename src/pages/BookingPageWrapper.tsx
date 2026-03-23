import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useBookingStore } from '../store/useBookingStore';
import { BookingView } from './BookingPage';

export default function BookingPageWrapper() {
  const navigate = useNavigate();
  const { handleBookSlot, user, slots } = useOutletContext<any>();
  const { sportCenters, courts, selectedCenterId, setSelectedCenterId } = useBookingStore();

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
