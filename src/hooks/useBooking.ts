import { useState, useEffect } from 'react';
import { format, addDays, startOfToday, setHours, setMinutes } from 'date-fns';
import { toast } from 'sonner';
import { TimeSlot, Booking, SlotStatus, UserProfile, GuestDetails } from '../types';
import { COURTS } from '../data/mockData';

const getPriceForHour = (hour: number): number => {
    if (hour >= 18 && hour < 22) return 45000;
    if (hour >= 22 || hour < 9) return 28000;
    return 35000;
};

const generateSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const today = startOfToday();

    COURTS.forEach(court => {
        for (let i = 0; i < 7; i++) {
            const day = addDays(today, i);
            for (let hour = 9; hour <= 23; hour++) {
                const date = setMinutes(setHours(day, hour), 0);
                const id = `${court.id}-${format(date, 'yyyy-MM-dd')}-${hour}`;

                const random = Math.random();
                let status: SlotStatus = 'available';
                if (random > 0.85) status = 'reserved';

                slots.push({
                    id,
                    courtId: court.id,
                    centerId: court.centerId,
                    date,
                    status,
                    price: getPriceForHour(hour)
                });
            }
        }
    });
    return slots;
};

export const useBooking = (user: UserProfile | null) => {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

    useEffect(() => {
        setSlots(generateSlots());
    }, []);

    const handleBookSlot = (slot: TimeSlot) => {
        setSelectedSlot(slot);
    };

    const confirmBooking = (method: 'mercadopago' | 'fintoc' | 'cash', guestDetails?: GuestDetails) => {
        if (!selectedSlot) return;

        const newBooking: Booking = {
            id: Math.random().toString(36).substr(2, 9),
            slotId: selectedSlot.id,
            courtId: selectedSlot.courtId,
            centerId: selectedSlot.centerId,
            date: selectedSlot.date.toISOString(),
            price: selectedSlot.price,
            status: 'confirmed',
            createdAt: Date.now(),
            paymentMethod: method,
            userName: user ? user.name : (guestDetails?.name || 'Invitado'),
            userEmail: user ? user.email : (guestDetails?.email || ''),
            isGuest: !user
        };

        setBookings(prev => [newBooking, ...prev]);
        setSlots(prev => prev.map(s => s.id === selectedSlot.id ? { ...s, status: 'user-reserved' } : s));
        setSelectedSlot(null);

        toast.success('¡Reserva confirmada!', {
            description: user 
                ? `Pago procesado exitosamente vía ${method}.`
                : `Enviamos el comprobante a ${guestDetails?.email}.`,
            duration: 5000,
        });

        return newBooking;
    };

    const cancelBooking = (booking: Booking) => {
        if (confirm('¿Confirmar cancelación y reembolso?')) {
            setBookings(prev => prev.map(b =>
                b.id === booking.id ? { ...b, status: 'cancelled' } : b
            ));
            setSlots(prev => prev.map(s => s.id === booking.slotId ? { ...s, status: 'available' } : s));
            toast.info('Reserva cancelada', {
                description: 'El reembolso ha sido procesado.',
            });
        }
    };

    const blockSlot = (slot: TimeSlot) => {
        if (confirm("¿Bloquear este horario para mantenimiento o uso interno?")) {
            setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: 'maintenance' } : s));
            toast.info("Horario bloqueado exitosamente");
        }
    };

    return {
        slots,
        bookings,
        selectedSlot,
        handleBookSlot,
        confirmBooking,
        cancelBooking,
        blockSlot,
        setSelectedSlot
    };
};