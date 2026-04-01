import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useBookingStore } from '../store/useBookingStore';
import { useBooking } from './useBooking';
import { UserProfile } from '../types';

export const useBookingActions = (user: UserProfile | null) => {
  const navigate = useNavigate();
  const { createMercadoPagoPayment, createBooking } = useBookingStore();
  const {
    slots,
    bookings,
    selectedSlot,
    handleBookSlot,
    confirmBooking: confirmMockBooking,
    cancelBooking,
    blockSlot,
    setSelectedSlot,
  } = useBooking(user);

  const handleConfirmBooking = async (method: 'mercadopago' | 'venue' | 'cash', guestDetails?: any) => {
    if (method === 'mercadopago' && selectedSlot) {
      try {
        const init_point = await createMercadoPagoPayment({
          court_id: selectedSlot.courtId,
          date: selectedSlot.date.toISOString(),
          hour: selectedSlot.date.getHours(),
          guest_details: guestDetails,
          user_id: user?.id,
        });

        // Redirigir a MercadoPago Checkout
        window.location.href = init_point;
      } catch (error) {
        toast.error("Error al iniciar el pago con MercadoPago.");
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
        setSelectedSlot(null);
        navigate('/');
      } catch (error) {
        toast.error("Error al confirmar la reserva.");
      }
      return;
    }

    // Fallback for other methods or mock logic
    const booking = confirmMockBooking(method as any, guestDetails);
    if (booking) {
      if (user) {
        navigate('/mis-reservas');
      } else {
        navigate('/');
      }
    }
  };

  return {
    slots,
    bookings,
    selectedSlot,
    handleBookSlot,
    handleConfirmBooking,
    cancelBooking,
    blockSlot,
    setSelectedSlot,
  };
};
