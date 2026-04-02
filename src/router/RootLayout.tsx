import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AnimatePresence } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { PaymentModal } from '../components/booking/PaymentModal';
import { useBookingStore } from '../store/useBookingStore';
import { useBookingActions } from '../hooks/useBookingActions';
import { useAuth } from '../hooks/useAuth';

export const RootLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdministrator, isLoading: authLoading } = useAuth();

  const {
    courts,
    initialize,
    fetchSportCenterBySlug,
  } = useBookingStore();

  const {
    slots,
    bookings,
    selectedSlot,
    handleBookSlot,
    handleConfirmBooking,
    cancelBooking,
    blockSlot,
    setSelectedSlot,
  } = useBookingActions(user);

  // Initialize store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Dynamic page title
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'ReservaloYA',
      '/reservar': 'Reservar Cancha | ReservaloYA',
      '/ubicacion': 'Información | ReservaloYA',
      '/booking/status': 'Estado de Reserva | ReservaloYA',
      '/booking/success': '¡Reserva Confirmada! | ReservaloYA',
      '/booking/failure': 'Error en Reserva | ReservaloYA',
      '/mis-reservas': 'Mis Reservas | ReservaloYA',
      '/admin': 'Panel de Administración | ReservaloYA',
    };
    document.title = titles[location.pathname] || 'ReservaloYA';
  }, [location.pathname]);

  // Payment redirect detection (code without state)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && !state && !location.pathname.startsWith('/booking/')) {
      navigate(`/booking/status${window.location.search}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100">
      <Toaster richColors position="top-center" />
      <Navbar />
      <main className="pt-16">
        <Outlet context={{
          handleBookSlot,
          handleConfirmBooking,
          cancelBooking,
          blockSlot,
          user,
          isAdministrator,
          authLoading,
          slots,
          bookings
        }} />
      </main>

      <AnimatePresence>
        {selectedSlot && (
          <PaymentModal
            slot={selectedSlot}
            court={( courts ).find(c => c.id === selectedSlot.courtId)!}
            onClose={() => setSelectedSlot(null)}
            onConfirm={handleConfirmBooking}
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
