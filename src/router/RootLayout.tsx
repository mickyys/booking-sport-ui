import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AnimatePresence } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { PaymentModal } from '../components/booking/PaymentModal';
import { useBookingStore } from '../store/useBookingStore';
import { useBookingActions } from '../hooks/useBookingActions';
import { useAuth } from '../hooks/useAuth';
import { COURTS as MOCK_COURTS } from '../data/mockData';

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

  // Fintoc redirect detection (code without state)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && !state && !location.pathname.startsWith('/booking/')) {
      navigate(`/booking/status${window.location.search}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  // Subdomain / slug detection
  useEffect(() => {
    const hostname = window.location.hostname;
    const params = new URLSearchParams(window.location.search);
    const slugQuery = params.get('slug');
    const parts = hostname.split('.');
    let slug = '';

    // 1. Query parameter has priority
    if (slugQuery) {
      slug = slugQuery;
    }
    // 2. Subdomain detection (if no query param)
    else if (parts.length >= 3) {
      const subdomain = parts[0].toLowerCase();
      if (subdomain !== 'www') {
        slug = subdomain;
      }
    }

    console.log('Detected slug:', slug);

    // Only fetch if we have a valid slug and it's not 'www'
    if (slug && slug !== 'www') {
      fetchSportCenterBySlug(slug).then(center => {
        if (center && location.pathname === '/') {
          navigate('/reservar', { replace: true });
        }
      });
    }
  }, [fetchSportCenterBySlug, navigate, location.pathname]);

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
            court={(courts.length > 0 ? courts : MOCK_COURTS).find(c => c.id === selectedSlot.courtId)!}
            onClose={() => setSelectedSlot(null)}
            onConfirm={handleConfirmBooking}
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
