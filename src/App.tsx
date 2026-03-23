import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import axios from 'axios';
import { Navbar } from './components/layout/Navbar';
import { BookingView } from './pages/BookingPage';
import { AdminPanel } from './pages/AdminPage';
import { Hero } from './pages/HomePage';
import { ClientDashboard } from './pages/ClientDashboard';
import { LocationServices } from './pages/LocationServicesPage';
import { SuccessPage } from './pages/booking/SuccessPage';
import { FailurePage } from './pages/booking/FailurePage';
import { PaymentModal } from './components/booking/PaymentModal';
import { COURTS as MOCK_COURTS } from './data/mockData';
import { useAuth } from './hooks/useAuth';
import { useBooking } from './hooks/useBooking';
import { useBookingStore } from './store/useBookingStore';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && !state) return 'booking-status';

    const path = window.location.pathname;
    if (path === '/booking/success') return 'booking-success';
    if (path === '/booking/failure') return 'booking-failure';
    return 'home';
  });
  const [bookingCode, setBookingCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    // Auth0 always sends both code AND state on redirect. 
    // Booking codes from Fintoc only have 'code' (or we only care about 'code' there).
    if (code && state) return null;
    return code;
  });

  const { user, isAdministrator, isLoading: authLoading } = useAuth();

  // Dynamic page title
  useEffect(() => {
    const titles: Record<string, string> = {
      'home': 'ReservaloYA',
      'book': 'Reservar Cancha | ReservaloYA',
      'info': 'Información | ReservaloYA',
      'booking-status': 'Estado de Reserva | ReservaloYA',
      'booking-success': '¡Reserva Confirmada! | ReservaloYA',
      'booking-failure': 'Error en Reserva | ReservaloYA',
      'client-dashboard': 'Mis Reservas | ReservaloYA',
      'admin': 'Panel de Administración | ReservaloYA',
    };
    document.title = titles[currentView] || 'ReservaloYA';
  }, [currentView]);

  const {
    sportCenters,
    courts,
    selectedCenterId,
    currentBooking,
    isLoading: storeLoading,
    fetchBookingByCode,
    createFintocPayment,
    createBooking,
    setSelectedCenterId,
    fetchSportCenterBySlug,
    initialize
  } = useBookingStore();

  useEffect(() => {
    const hostname = window.location.hostname;
    // For local dev, we might use a query param 'slug' for testing
    const params = new URLSearchParams(window.location.search);
    const slugQuery = params.get('slug');

    const parts = hostname.split('.');
    let slug = '';

    console.log('hostname', hostname);
    console.log('parts', parts);
    console.log('slugQuery', slugQuery);

    // Logic for orellana.reservaloya.cl or orellana.localhost
    if (parts.length >= 2 && hostname.endsWith('.localhost')) {
      slug = parts[0];
    } else if (parts.length >= 3) {
      slug = parts[0];
      if (slug === 'www') slug = '';
    }

    // Si no se detectó por host, usamos el query param
    if (!slug && slugQuery) {
      slug = slugQuery;
    }

    console.log('slug', slug);

    if (slug) {
      fetchSportCenterBySlug(slug).then(center => {
        console.log('center', center);
        if (center) {
          // If we are on home and have a valid subdomain, go to book view
          if (currentView === 'home') {
            setCurrentView('book');
          }
        }
      });
    }
  }, [fetchSportCenterBySlug, currentView]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (currentView === 'booking-status' && bookingCode) {
      fetchBookingByCode(bookingCode);
    }
  }, [currentView, bookingCode, fetchBookingByCode]);

  const {
    slots,
    bookings,
    selectedSlot,
    handleBookSlot,
    confirmBooking,
    cancelBooking,
    blockSlot,
    setSelectedSlot
  } = useBooking(user);

  const handleConfirmBooking = async (method: 'fintoc' | 'venue' | 'cash', guestDetails?: any) => {
    if (method === 'fintoc' && selectedSlot) {
      try {
        const redirect_url = await createFintocPayment({
          court_id: selectedSlot.courtId,
          date: selectedSlot.date.toISOString(),
          hour: selectedSlot.date.getHours(),
          guest_details: guestDetails,
          user_id: user?.id,
        });

        // Redirigir a Fintoc Checkout
        window.location.href = redirect_url;

      } catch (error) {
        toast.error("Error al iniciar el pago con Fintoc.");
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

        toast.success("¡Reserva confirmada exitosamente!");
        setCurrentView('home');
        setSelectedSlot(null);
        // Podríamos redirigir a una página de éxito o al dashboard
      } catch (error) {
        toast.error("Error al confirmar la reserva.");
      }
      return;
    }

    const booking = confirmBooking(method as any, guestDetails);
    if (booking && user) {
      setCurrentView('client-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100">
      <Toaster richColors position="top-center" />
      <Navbar
        onViewChange={setCurrentView}
        currentView={currentView}
      />

      <main className="pt-16">
        {currentView === 'home' && (
          <>
            <Hero
              onCtaClick={() => setCurrentView('book')}
              selectedCenter={selectedCenterId}
              onCenterChange={setSelectedCenterId}
              sportCenters={sportCenters}
            />
            <div className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
                  Nuestras Canchas en {sportCenters.find(c => c.id === selectedCenterId)?.location || 'Cargando...'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {courts.filter(court => court.centerId === selectedCenterId).map((court) => (
                    <div key={court.id} className="group cursor-pointer p-4 rounded-3xl hover:bg-slate-50 transition-colors" onClick={() => setCurrentView('book')}>
                      <div className="relative h-48 mb-6 overflow-hidden rounded-2xl">
                        <img src={court.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={court.name} />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          Disponible
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-600 transition-colors">{court.name}</h3>
                      <p className="text-slate-500">{court.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {currentView === 'info' && <LocationServices selectedCenter={selectedCenterId} />}

        {currentView === 'booking-status' && (
          <div className="max-w-xl mx-auto px-4">
            {(storeLoading && !currentBooking) && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-4"></div>
                <p className="text-slate-500">Verificando estado de tu reserva...</p>
              </div>
            )}
            {currentBooking?.status === 'confirmed' && (
              <SuccessPage
                onGoHome={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentView('home');
                }}
                onGoToProfile={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentView('client-dashboard');
                }}
              />
            )}
            {(currentBooking?.status === 'cancelled' || (!storeLoading && !currentBooking)) && (
              <FailurePage
                onRetry={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentView('book');
                }} onGoHome={function (): void {
                  throw new Error('Function not implemented.');
                }} />
            )}
            {currentBooking?.status === 'pending' && (
              <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full"></div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Pago en proceso</h2>
                <p className="text-slate-500 mb-8">
                  Estamos esperando la confirmación de Fintoc. Esto puede tardar unos segundos.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-colors w-full"
                >
                  Actualizar Estado
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'book' && (
          <BookingView
            onBookSlot={handleBookSlot}
            user={user}
            slots={slots}
            selectedCenter={selectedCenterId}
            onCenterChange={setSelectedCenterId}
            sportCenters={sportCenters}
            courts={courts}
          />
        )}

        {currentView === 'client-dashboard' && user && (
          <ClientDashboard user={user} />
        )}

        {currentView === 'booking-success' && (
          <SuccessPage
            onGoHome={() => {
              window.history.pushState({}, '', '/');
              setCurrentView('home');
            }}
            onGoToProfile={() => {
              window.history.pushState({}, '', '/');
              setCurrentView('client-dashboard');
            }}
          />
        )}

        {currentView === 'booking-failure' && (
          <FailurePage
            onRetry={() => {
              window.history.pushState({}, '', '/');
              setCurrentView('book');
            }}
            onGoHome={() => {
              window.history.pushState({}, '', '/');
              setCurrentView('home');
            }}
          />
        )}

        {currentView === 'admin' && (
          authLoading
            ? <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            : isAdministrator
              ? <AdminPanel
                  bookings={bookings}
                  slots={slots}
                  onCancelBooking={cancelBooking}
                  onBlockSlot={blockSlot}
                />
              : <div className="flex items-center justify-center min-h-[60vh]">
                  <p className="text-slate-500 text-lg font-medium">Acceso restringido</p>
                </div>
        )}
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
}
