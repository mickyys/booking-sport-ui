import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useBookingStore } from '../store/useBookingStore';
import { useBooking } from './useBooking';
import { UserProfile } from '../types';
import axios from 'axios';

export const useBookingActions = (user: UserProfile | null) => {
  const router = useRouter();
  const { createMercadoPagoPayment, createFintocPayment, createBooking } = useBookingStore();
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

  const handleConfirmBooking = async (method: 'mercadopago' | 'fintoc' | 'venue' | 'presential' | 'cash', guestDetails?: any, partial: boolean = false) => {
    if (method === 'mercadopago' && selectedSlot) {
      try {
        const init_point = await createMercadoPagoPayment({
          court_id: selectedSlot.courtId,
          date: selectedSlot.date.toISOString(),
          hour: selectedSlot.date.getHours(),
          guest_details: guestDetails,
          user_id: user?.id,
          partial,
        });

        // Redirigir a MercadoPago Checkout
        window.location.href = init_point;
        return true;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          toast.error("Este horario ya ha sido reservado por otra persona. Por favor elige otro.");
        } else {
          toast.error("Error al iniciar el pago con MercadoPago.");
        }
        throw error;
      }
    }

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
        return true;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          toast.error("Este horario ya ha sido reservado por otra persona. Por favor elige otro.");
        } else {
          toast.error("Error al iniciar el pago con Fintoc.");
        }
        throw error;
      }
    }

    if ((method === 'venue' || method === 'presential') && selectedSlot) {
      try {
        const booking = await createBooking({
          court_id: selectedSlot.courtId,
          date: selectedSlot.date.toISOString(),
          hour: selectedSlot.date.getHours(),
          guest_details: guestDetails,
          user_id: user?.id,
          partial: partial,
        });

        toast.success("¡Reserva confirmada exitosamente!");
        setSelectedSlot(null);
        router.push(`/booking/success?code=${booking?.booking_code ?? 'N/A'}`);
        return true;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          toast.error("Este horario ya ha sido reservado por otra persona. Por favor elige otro.");
        } else {
          toast.error("Error al confirmar la reserva.");
        }
        throw error;
      }
    }

    // Fallback for other methods or mock logic
    const booking = confirmMockBooking(method as any, guestDetails);
    if (booking) {
      if (user) {
        router.push('/mis-reservas');
      } else {
        router.push('/');
      }
      return true;
    }
    return false;
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
