import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { AdminPanel } from './AdminPage';

export default function AdminPageWrapper() {
  const { cancelBooking, blockSlot, isAdministrator, authLoading, slots, bookings } = useOutletContext<any>();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdministrator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500 text-lg font-medium">Acceso restringido</p>
      </div>
    );
  }

  return (
    <AdminPanel
      bookings={bookings}
      slots={slots}
      onCancelBooking={cancelBooking}
      onBlockSlot={blockSlot}
    />
  );
}
