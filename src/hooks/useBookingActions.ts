import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useBookingStore } from '../store/useBookingStore';
import { useBooking } from './useBooking';
import { UserProfile } from '../types';
import axios from 'axios';
import { buildPaymentWindow, PaymentWindowInfo, parseSlotConflict } from '../lib/paymentWindow';
import { showSlotConflictToast } from '../components/booking/showSlotConflictToast';
import { santiagoDateKey } from '../lib/santiago';

export const useBookingActions = (user: UserProfile | null) => {
  const router = useRouter();
  const { createMercadoPagoPayment, createBooking, fetchSchedules } = useBookingStore();
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

  // Ventana de pago activa: se muestra mientras el cliente paga en Mercado Pago.
  const [paymentWindow, setPaymentWindow] = useState<PaymentWindowInfo | null>(null);

  const closePaymentWindow = useCallback(() => setPaymentWindow(null), []);

  const showSlotConflictNotice = (error: unknown): boolean => {
    const conflict = parseSlotConflict(error);
    if (!conflict) return false;
    showSlotConflictToast(conflict);
    // Otra persona confirmó el horario: se cierra el checkout y se refresca la
    // agenda para que el horario deje de ofrecerse.
    if (conflict.kind === 'confirmed' && selectedSlot) {
      setSelectedSlot(null);
      if (selectedSlot.centerId) {
        void fetchSchedules(selectedSlot.centerId, santiagoDateKey(selectedSlot.date));
      }
    }
    return true;
  };

  const handleConfirmBooking = async (
    method: 'mercadopago' | 'venue' | 'presential' | 'cash',
    guestDetails?: any,
    partial: boolean = false,
    benefits?: { discountCode?: string; memberToken?: string },
  ) => {
    const getErrorMessage = (error: unknown, fallback: string): string => {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return error.response.data.error;
      }
      return fallback;
    };
    if (method === 'mercadopago' && selectedSlot) {
      // La pestaña se abre antes del request: si se abre después de un await,
      // los navegadores la bloquean como popup. Se navega cuando llega el
      // init_point y, si está bloqueada, se usa la misma pestaña.
      const paymentTab = typeof window !== 'undefined' ? window.open('', '_blank') : null;

      try {
        const data = await createMercadoPagoPayment({
          court_id: selectedSlot.courtId,
          date: selectedSlot.date.toISOString(),
          hour: selectedSlot.hour,
          minutes: selectedSlot.minutes ?? 0,
          guest_details: guestDetails,
          user_id: user?.id,
          partial,
          discount_code: benefits?.discountCode || undefined,
          member_token: benefits?.memberToken || undefined,
        });

        // Total cubierto por un beneficio: la reserva nace confirmada y no hay
        // pasarela de pago.
        if (!data.init_point) {
          paymentTab?.close();
          toast.success('¡Reserva confirmada exitosamente!');
          setSelectedSlot(null);
          router.push(`/booking/success?code=${encodeURIComponent(data.booking_code ?? '')}`);
          return true;
        }

        if (paymentTab) {
          paymentTab.location.href = data.init_point;
          try {
            paymentTab.opener = null;
          } catch {
            /* cross-origin: el navegador ya la aisló */
          }
        } else {
          window.location.href = data.init_point;
        }

        setPaymentWindow(buildPaymentWindow(data));
        setSelectedSlot(null);
        return true;
      } catch (error) {
        paymentTab?.close();
        if (!showSlotConflictNotice(error)) {
          toast.error(getErrorMessage(error, "Error al iniciar el pago con MercadoPago."));
        }
        throw error;
      }
    }

    if ((method === 'venue' || method === 'presential') && selectedSlot) {
      try {
        const booking = await createBooking({
          court_id: selectedSlot.courtId,
          date: selectedSlot.date.toISOString(),
          hour: selectedSlot.hour,
          minutes: selectedSlot.minutes ?? 0,
          guest_details: guestDetails,
          user_id: user?.id,
          partial: partial,
          discount_code: benefits?.discountCode || undefined,
          member_token: benefits?.memberToken || undefined,
        });

        toast.success("¡Reserva confirmada exitosamente!");
        setSelectedSlot(null);
        router.push(`/booking/success?code=${booking?.booking_code ?? 'N/A'}`);
        return true;
      } catch (error) {
        if (!showSlotConflictNotice(error)) {
          toast.error(getErrorMessage(error, "Error al confirmar la reserva."));
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
    paymentWindow,
    closePaymentWindow,
  };
};
