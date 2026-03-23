import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { AdminPanel } from './AdminPage';

export default function AdminPageWrapper() {
  const { cancelBooking, blockSlot } = useOutletContext<any>();

  return (
    <AdminPanel
      bookings={[]}
      slots={[]}
      onCancelBooking={cancelBooking}
      onBlockSlot={blockSlot}
    />
  );
}
