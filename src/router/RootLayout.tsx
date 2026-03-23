import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AnimatePresence } from 'motion/react';
import { Navbar } from '../components/layout/Navbar';
import { PaymentModal } from '../components/booking/PaymentModal';
import { useBookingStore } from '../store/useBookingStore';
import { useBooking } from '../hooks/useBooking';
import { useAuth } from '../hooks/useAuth';
import { COURTS as MOCK_COURTS } from '../data/mockData';
import { toast } from 'sonner';

export const RootLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const {
    courts,
    initialize,
    createFintocPayment,
    createBooking,
    fetchSportCenterBySlug,
    setSelectedCenterId,
  } = useBookingStore();

  const {
    selectedSlot,
    handleBookSlot,
    confirmBooking,
    cancelBooking,
    blockSlot,
    setSelectedSlot,
  } = useBooking(user);

  // Initialize store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Subdomain / slug detection
  useEffect(() => {
    const hostname = window.location.hostname;
    const params = new URLSearchParams(window.location.search);
    const slugQuery = params.get('slug');
    const parts = hostname.split('.');
    let slug = '';

    if (parts.length >= 2 && hostname.endsWith('.localhost')) {
      slug = parts[0];
    } else if (parts.length >= 3) {
      slug = parts[0];
      if (slug === 'www') slug = '';
    }

    if (!slug && slugQuery) slug = slugQuery;

    if (slug) {
      fetchSportCenterBySlug(slug).then(center => {
        if (center && location.pathname === '/') {
          navigate('/reservar', { replace: true });
        }
      });
    }
  }, [fetchSportCenterBySlug, navigate, location.pathname]);

  const handleConfirmBooking = async (method: 'fintoc' | 'venue', guestDetails?: any) => {
    if (method === 'fintoc' && selectedSlot) {
      try {
        const redirect_url = await createFintocPayment({
          court_id: selectedSlot.courtId,
          date: selectedSlot.date.toISOString(),
          hour: selectedSlot.date.getHours(),
          guest_details: guestDetails,
          user_id: user?.id,
        });
        window.location.href = redirect_url;
      } catch {
        toast.error('Error al iniciar el pago con Fintoc.');
      }
      return;
    }

    if (method === 'venue' && selectedSlot) {
      try {
        await createBooking({
          court_id: selectedSlot.courtId,
          date: selectedSlot.date.toISOString(),
          hour: selectedSlot.date.getHours(),
          guest_details: guestDetails,
          user_id: user?.id,
        });
        toast.success('¡Reserva confirmada exitosamente!');
        setSelectedSlot(null);
        navigate('/');
      } catch {
        toast.error('Error al confirmar la reserva.');
      }
      return;
    }

    const booking = confirmBooking(method as any, guestDetails);
    if (booking && user) navigate('/mis-reservas');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100">
      <Toaster richColors position="top-center" />
      <Navbar currentView={location.pathname} />
      <main className="pt-16">
        <Outlet context={{ handleBookSlot, cancelBooking, blockSlot, user }} />
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
