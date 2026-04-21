"use client";
"use client";
import React, { useState, useEffect } from 'react';
import { Ban, Calendar, User, Phone, Unlock, CheckCircle, Clock, AlertTriangle, Repeat, X, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { format, startOfToday, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { TimeSlot } from '@/types';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import axios from 'axios';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminCalendarProps {
    courts: any[];
}

export const AdminCalendar: React.FC<AdminCalendarProps> = ({
    courts
}) => {
    const { getAccessTokenSilently } = useAuth0();
    const {
        schedules,
        fetchAdminSchedules,
        createInternalBooking,
        deleteBooking,
        deleteSeries,
        selectedCenterId,
        createRecurringReservation,
        cancelRecurringReservation,
        fetchRecurringReservationsByCenter
    } = useBookingStore();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
    const [bookingMode, setBookingMode] = useState<{ slot: any, mode: 'block' | 'reserve' } | null>(null);
    const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', price: '' });
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringType, setRecurringType] = useState<'weeks' | 'weekly' | null>(null);
    const [recurringWeeks, setRecurringWeeks] = useState(4);
    const [isCreating, setIsCreating] = useState(false);
    const [courtViewMode, setCourtViewMode] = useState<'single' | 'all'>('all');

    // Unlock confirmation state
    const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
    const [slotToUnlock, setSlotToUnlock] = useState<{ bookingId?: string, seriesId?: string, recurringId?: string } | null>(null);

    useEffect(() => {
        const centerId = courts.find(c => c.id === selectedCourtId)?.centerId || selectedCenterId;
        if (centerId) {
            fetchAdminSchedules(centerId, format(selectedDate, 'yyyy-MM-dd'), getAccessTokenSilently);
        }
    }, [selectedDate, selectedCenterId, selectedCourtId, courts.length]);

    useEffect(() => {
        if (selectedCenterId && courts.length > 0) {
            const timer = setTimeout(() => {
                fetchAdminSchedules(selectedCenterId, format(selectedDate, 'yyyy-MM-dd'), getAccessTokenSilently);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedCenterId, courts.length]);

    useEffect(() => {
        if (courts.length > 0 && !selectedCourtId) {
            setSelectedCourtId(courts[0].id);
        }
    }, [courts, selectedCourtId]);

    useEffect(() => {
        if (!unlockConfirmOpen) {
            setSlotToUnlock(null);
        }
    }, [unlockConfirmOpen]);

    useEffect(() => {
        if (courts.length > 0 && !selectedCourtId) {
            setSelectedCourtId(courts[0].id);
        }
    }, [courts, selectedCourtId]);

    const handleInternalReserve = async () => {
        if (!bookingMode) return;
        setIsCreating(true);

        // Handle weekly indefinite recurring reservation
        if (bookingMode.mode === 'reserve' && recurringType === 'weekly') {
            try {
                const recurringData = {
                    court_id: bookingMode.slot.courtId,
                    sport_center_id: selectedCenterId || undefined,
                    customer_name: guestInfo.name,
                    customer_phone: guestInfo.phone,
                    hour: bookingMode.slot.hour,
                    price: parseFloat(guestInfo.price) || bookingMode.slot.price,
                    notes: '',
                    date: format(selectedDate, 'yyyy-MM-dd')
                };

                await createRecurringReservation(recurringData, getAccessTokenSilently);

                await fetchAdminSchedules(selectedCenterId!, format(selectedDate, 'yyyy-MM-dd'), getAccessTokenSilently);

                toast.success('Reserva semanal creada con éxito');
            } catch (error) {
                console.error("Error creating weekly reservation:", error);
                if (axios.isAxiosError(error) && error.response?.status === 409) {
                    toast.error("Ya existe una reserva semanal para este horario.");
                } else {
                    toast.error("Error al crear reserva semanal.");
                }
            } finally {
                setBookingMode(null);
                setGuestInfo({ name: '', phone: '', price: '' });
                setRecurringType(null);
                setIsCreating(false);
            }
            return;
        }

        // Handle recurring with X weeks (creates multiple bookings)
        const weeksToProcess = recurringType === 'weeks' ? recurringWeeks : 1;
        const successDates: string[] = [];
        const seriesId = recurringType === 'weeks' ? `SERIE-${crypto.randomUUID().slice(0, 8).toUpperCase()}` : undefined;

        try {
            for (let i = 0; i < weeksToProcess; i++) {
                const currentDate = addDays(selectedDate, i * 7);

                const bookingData: any = {
                    court_id: bookingMode.slot.courtId,
                    sport_center_id: selectedCenterId, // Agregado para asegurar consistencia
                    date: currentDate.toISOString(),
                    hour: bookingMode.slot.hour,
                    customer_name: guestInfo.name, // Sin el (R) para que el agrupamiento sea limpio
                    customer_phone: guestInfo.phone,
                    guest_details: bookingMode.mode === 'reserve' ? {
                        name: guestInfo.name,
                        phone: guestInfo.phone,
                        email: 'admin@internal.com'
                    } : null,
                    status: 'confirmed',
                    payment_method: 'internal',
                    series_id: seriesId
                };

                await createInternalBooking(bookingData, getAccessTokenSilently);
                successDates.push(format(currentDate, 'dd/MM'));
            }

            setBookingMode(null);
            setGuestInfo({ name: '', phone: '', price: '' });
            setIsRecurring(false);
            setRecurringType(null);
            setRecurringWeeks(4);

            await fetchAdminSchedules(selectedCenterId!, format(selectedDate, 'yyyy-MM-dd'), getAccessTokenSilently);

            toast.success(weeksToProcess > 1
                ? `Se crearon ${weeksToProcess} reservas con éxito`
                : (bookingMode.mode === 'reserve' ? "Reserva guardada con éxito" : "Horario bloqueado")
            );
        } catch (error) {
            console.error("Error creating bookings:", error);
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                toast.error("El horario ya no está disponible. Por favor actualice el calendario.");
            } else if (successDates.length > 0) {
                toast.error(`Error parcial: Solo se crearon las primeras ${successDates.length} reservas.`);
            } else {
                toast.error("Error al realizar la acción. Verifique disponibilidad.");
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleUnlock = (bookingId?: string, seriesId?: string, recurringId?: string) => {
        if (!bookingId && !seriesId && !recurringId) {
            toast.error("No se encontró el ID de la reserva para desbloquear");
            return;
        }
        setSlotToUnlock({ bookingId, seriesId, recurringId });
        setUnlockConfirmOpen(true);
    };

    const confirmUnlockSingle = async () => {
        if (!slotToUnlock?.bookingId) return;
        try {
            await deleteBooking(slotToUnlock.bookingId, getAccessTokenSilently);
            toast.success("Horario desbloqueado con éxito");
            await fetchAdminSchedules(selectedCenterId!, format(selectedDate, 'yyyy-MM-dd'), getAccessTokenSilently);
        } catch (error) {
            toast.error("Error al desbloquear");
        } finally {
            setUnlockConfirmOpen(false);
            setSlotToUnlock(null);
        }
    };

    const confirmUnlockSeries = async () => {
        if (!slotToUnlock?.seriesId) return;
        try {
            await (deleteSeries as any)(slotToUnlock.seriesId, getAccessTokenSilently);
            toast.success("Toda la serie de reservas eliminada");
            await fetchAdminSchedules(selectedCenterId!, format(selectedDate, 'yyyy-MM-dd'), getAccessTokenSilently);
        } catch (error) {
            toast.error("Error al desbloquear toda la serie");
        } finally {
            setUnlockConfirmOpen(false);
            setSlotToUnlock(null);
        }
    };

    const confirmUnlockRecurring = async () => {
        if (!slotToUnlock?.recurringId) return;
        try {
            await cancelRecurringReservation(slotToUnlock.recurringId, getAccessTokenSilently);
            toast.success("Reserva semanal cancelada");
            await fetchAdminSchedules(selectedCenterId!, format(selectedDate, 'yyyy-MM-dd'), getAccessTokenSilently);
        } catch (error) {
            toast.error("Error al cancelar reserva semanal");
        } finally {
            setUnlockConfirmOpen(false);
            setSlotToUnlock(null);
        }
    };

    // Navigation functions
    const goToPreviousDay = () => {
        setSelectedDate(prev => addDays(prev, -1));
    };

    const goToNextDay = () => {
        setSelectedDate(prev => addDays(prev, 1));
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const handleSlotClick = (courtId: string, slot: any) => {
        if (slot.status === 'available' || slot.status === 'unavailable') {
            setBookingMode({ slot: { ...slot, courtId }, mode: 'reserve' });
        }
    };

    const currentCourtSchedule = schedules.find(s => s.id === selectedCourtId);
    const slots = currentCourtSchedule?.schedule || [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Calendario de Reservas</h2>
                    <p className="text-slate-500 mt-1">Selecciona un horario disponible para crear una reserva interna o bloquear la cancha.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCourtViewMode('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                            courtViewMode === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <LayoutGrid size={16} />
                        Todas
                    </button>
                    <button
                        onClick={() => setCourtViewMode('single')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                            courtViewMode === 'single' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <List size={16} />
                        Una Cancha
                    </button>
                </div>
            </div>

            {/* Header / Filtros */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-6 items-end">
                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousDay}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-bold text-slate-600"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={goToNextDay}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Fecha</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="date"
                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all font-medium"
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                        />
                    </div>
                </div>

                {courtViewMode === 'single' && (
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Seleccionar Cancha</label>
                        <select
                            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-slate-200 transition-all font-medium"
                            value={selectedCourtId || ''}
                            onChange={(e) => setSelectedCourtId(e.target.value)}
                        >
                            {courts.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Single Court View */}
            {courtViewMode === 'single' && selectedCourtId && courts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {slots.map((slot, index) => {
                        const isBooked = slot.status === 'booked' || slot.status === 'reserved' || slot.status === 'passed_booked';
                        const isPassed = slot.status === 'passed';
                        const isClosed = slot.status === 'closed';
                        const isRecurringBooked = slot.status === 'recurring_booked' || slot.is_recurring_weekly;

                        return (
                            <div
                                key={index}
                                className={`p-4 rounded-3xl border transition-all duration-300 ${isRecurringBooked
                                        ? 'bg-amber-50 border-amber-200'
                                        : isBooked
                                            ? 'bg-slate-50 border-slate-200'
                                            : isClosed || isPassed
                                                ? 'bg-red-50 border-red-100 grayscale opacity-60'
                                                : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 group'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="flex items-center gap-1">
                                        {isRecurringBooked && <Repeat size={14} className="text-amber-600" />}
                                        <span className={`text-lg font-bold ${isBooked || isRecurringBooked ? 'text-slate-400' : 'text-slate-900'}`}>
                                            {String(slot.hour).padStart(2, '0')}:00
                                        </span>
                                    </div>

                                    {isRecurringBooked ? (
                                        <button
                                            onClick={() => handleUnlock(slot.booking_id, slot.series_id, slot.recurring_reservation_id)}
                                            className="w-full text-sm font-bold flex items-center justify-center gap-2 py-3 px-3 rounded-xl transition-colors text-amber-700 bg-amber-100 hover:bg-amber-200"
                                        >
                                            <Repeat size={14} />
                                            Reserv. Semanal
                                        </button>
                                    ) : isBooked ? (
                                        <button
                                            onClick={() => handleUnlock(slot.booking_id, slot.series_id)}
                                            className={`w-full text-sm font-bold flex items-center justify-center gap-2 py-3 px-3 rounded-xl transition-colors ${
                                                slot.series_id
                                                    ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-200'
                                                    : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                                            }`}
                                        >
                                            {slot.series_id ? <Clock size={14} className="animate-pulse" /> : <Unlock size={14} />}
                                            {slot.series_id ? 'Ver Serie' : 'Desbloquear'}
                                        </button>
                                    ) : isClosed || isPassed ? (
                                        <span className="text-sm font-bold text-red-400 py-3">{isPassed ? 'Pasado' : 'Cerrado'}</span>
                                    ) : (
                                        <div className="flex flex-col w-full gap-2">
                                            <button
                                                onClick={() => setBookingMode({ slot: { ...slot, courtId: selectedCourtId }, mode: 'reserve' })}
                                                className="w-full text-sm font-bold bg-emerald-500 text-white py-3 rounded-xl hover:bg-emerald-600 transition-all"
                                            >
                                                Reservar
                                            </button>
                                            <button
                                                onClick={() => setBookingMode({ slot: { ...slot, courtId: selectedCourtId }, mode: 'block' })}
                                                className="w-full text-sm font-bold text-slate-500 py-2 rounded-xl hover:bg-slate-50 transition-all border border-slate-100"
                                            >
                                                Bloquear
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* All Courts View - Courts in columns, hours in rows */}
            {courtViewMode === 'all' && courts.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                    {/* Header with court names */}
                    <div className="flex border-b border-slate-200 bg-slate-50">
                        <div className="w-24 shrink-0 p-4 border-r border-slate-200">
                            <span className="text-sm font-bold text-slate-500 uppercase">Hora</span>
                        </div>
                        {courts.map((court) => (
                            <div 
                                key={court.id} 
                                className="flex-1 p-4 text-center border-r border-slate-200 last:border-r-0 min-w-[140px]"
                            >
                                <span className="text-base font-bold text-slate-700">{court.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Hours as rows */}
                    {(() => {
                        const allHours = new Set<number>();
                        courts.forEach(court => {
                            const schedule = schedules.find(s => s.id === court.id);
                            schedule?.schedule.forEach((slot: any) => {
                                if (slot.hour >= 8 && slot.hour <= 22) {
                                    allHours.add(slot.hour);
                                }
                            });
                        });
                        const sortedHours = Array.from(allHours).sort((a, b) => a - b);

                        return sortedHours.map((hour) => (
                            <div key={hour} className="flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                <div className="w-24 shrink-0 p-4 border-r border-slate-200 bg-slate-50/50">
                                    <span className="text-lg font-bold text-slate-600">
                                        {String(hour).padStart(2, '0')}:00
                                    </span>
                                </div>
                                {courts.map((court) => {
                                    const courtSchedule = schedules.find(s => s.id === court.id);
                                    const slot = courtSchedule?.schedule.find((s: any) => s.hour === hour);
                                    
                                    if (!slot) {
                                        return (
                                            <div key={court.id} className="flex-1 p-4 border-r border-slate-200 last:border-r-0 min-w-[140px] min-h-[80px] flex items-center justify-center">
                                                <span className="text-sm text-slate-300">-</span>
                                            </div>
                                        );
                                    }

                                     const isBooked = slot.status === 'booked' || slot.status === 'reserved' || slot.status === 'passed_booked';
                                     const isPassed = slot.status === 'passed';
                                     const isClosed = slot.status === 'closed';
                                     const isRecurringBooked = slot.status === 'recurring_booked' || slot.is_recurring_weekly;
                                    const isAvailable = !isBooked && !isPassed && !isClosed && !isRecurringBooked;

                                    let bgColor = 'bg-white border border-slate-100';
                                    let content = null;

                                    if (isRecurringBooked) {
                                        bgColor = 'bg-amber-50 border border-amber-200';
                                        content = (
                                            <button
                                                onClick={() => handleUnlock(slot.booking_id, slot.series_id, slot.recurring_reservation_id)}
                                                className="w-full h-full flex items-center justify-center gap-2 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors rounded-2xl"
                                            >
                                                <Repeat size={14} />
                                                <span>Semanal</span>
                                            </button>
                                        );
                                    } else if (isBooked) {
                                        bgColor = slot.series_id ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-100 border border-slate-200';
                                        content = (
                                            <button
                                                onClick={() => handleUnlock(slot.booking_id, slot.series_id)}
                                                className={`w-full h-full flex items-center justify-center gap-2 text-sm font-bold transition-colors rounded-2xl ${
                                                    slot.series_id 
                                                        ? 'text-emerald-700 hover:bg-emerald-100' 
                                                        : 'text-slate-500 hover:bg-slate-200'
                                                }`}
                                            >
                                                {slot.series_id ? (
                                                    <>
                                                        <Clock size={14} className="animate-pulse" />
                                                        <span>Serie</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock size={14} />
                                                        <span>Desbloquear</span>
                                                    </>
                                                )}
                                            </button>
                                        );
                                    } else if (isPassed || isClosed) {
                                        bgColor = 'bg-red-50 border border-red-100';
                                        content = (
                                            <span className="w-full h-full flex items-center justify-center text-sm font-bold text-red-400">
                                                {isPassed ? 'Pasado' : 'Cerrado'}
                                            </span>
                                        );
                                    } else {
                                        bgColor = 'bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5';
                                        content = (
                                            <div className="flex flex-col gap-2 w-full p-2">
                                                <button
                                                    onClick={() => setBookingMode({ slot: { ...slot, courtId: court.id }, mode: 'reserve' })}
                                                    className="w-full text-sm font-bold bg-emerald-500 text-white py-3 rounded-xl hover:bg-emerald-600 transition-colors"
                                                >
                                                    Reservar
                                                </button>
                                                <button
                                                    onClick={() => setBookingMode({ slot: { ...slot, courtId: court.id }, mode: 'block' })}
                                                    className="w-full text-sm font-bold text-slate-500 py-2 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
                                                >
                                                    Bloquear
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div 
                                            key={court.id} 
                                            className={`flex-1 p-4 border-r border-slate-200 last:border-r-0 min-w-[140px] min-h-[80px] ${bgColor}`}
                                        >
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        ));
                    })()}
                </div>
            )}

            {/* Modal de Reserva Interna */}
            {bookingMode && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {bookingMode.mode === 'reserve' ? 'Nueva Reserva' : 'Bloquear Horario'}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    <span className="font-bold text-slate-900">{format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</span> a las {bookingMode.slot.hour}:00
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setBookingMode(null);
                                    setGuestInfo({ name: '', phone: '', price: '' });
                                    setIsRecurring(false);
                                    setRecurringType(null);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {bookingMode.mode === 'reserve' && (
                            <>
                                <div className="space-y-4 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 px-1">Nombre del Cliente</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                placeholder="Ej. Juan Pérez"
                                                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:ring-2 focus:ring-slate-900/5 transition-all"
                                                value={guestInfo.name}
                                                onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 px-1">Teléfono</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <input
                                                type="tel"
                                                placeholder="Ej. +569 1234 5678"
                                                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:ring-2 focus:ring-slate-900/5 transition-all"
                                                value={guestInfo.phone}
                                                onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tipo de reserva */}
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 space-y-3">
                                    <label className="text-sm font-bold text-slate-700">Tipo de reserva</label>
                                    
                                    <label className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${!recurringType ? 'bg-slate-200 ring-2 ring-slate-900' : 'bg-white hover:bg-slate-100'}`}>
                                        <input
                                            type="radio"
                                            name="recurringType"
                                            checked={recurringType === null}
                                            onChange={() => setRecurringType(null)}
                                            className="sr-only"
                                        />
                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${!recurringType ? 'border-slate-900' : 'border-slate-300'}`}>
                                            {!recurringType && <div className="w-3.5 h-3.5 rounded-full bg-slate-900" />}
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-bold text-slate-900 text-base block">Reserva Simple</span>
                                            <span className="text-sm text-slate-500">Solo para esta fecha</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${recurringType === 'weeks' ? 'bg-emerald-50 ring-2 ring-emerald-500' : 'bg-white hover:bg-slate-100'}`}>
                                        <input
                                            type="radio"
                                            name="recurringType"
                                            checked={recurringType === 'weeks'}
                                            onChange={() => setRecurringType('weeks')}
                                            className="sr-only"
                                        />
                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${recurringType === 'weeks' ? 'border-emerald-500' : 'border-slate-300'}`}>
                                            {recurringType === 'weeks' && <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />}
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-bold text-slate-900 text-base block">Reserva Recurrente</span>
                                            <span className="text-sm text-slate-500">Se repite por varias semanas</span>
                                        </div>
                                        {recurringType === 'weeks' && (
                                            <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full">
                                                {recurringWeeks} semanas
                                            </span>
                                        )}
                                    </label>

                                    <label className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${recurringType === 'weekly' ? 'bg-amber-50 ring-2 ring-amber-500' : 'bg-white hover:bg-slate-100'}`}>
                                        <input
                                            type="radio"
                                            name="recurringType"
                                            checked={recurringType === 'weekly'}
                                            onChange={() => setRecurringType('weekly')}
                                            className="sr-only"
                                        />
                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${recurringType === 'weekly' ? 'border-amber-500' : 'border-slate-300'}`}>
                                            {recurringType === 'weekly' && <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Repeat size={16} className={recurringType === 'weekly' ? 'text-amber-500' : 'text-slate-400'} />
                                                <span className="font-bold text-slate-900 text-base">Reserva Semanal</span>
                                            </div>
                                            <span className="text-sm text-slate-500">Se repite cada semana de forma indefinida</span>
                                        </div>
                                    </label>
                                </div>

                                {/* Selector de semanas para recurrente */}
                                {recurringType === 'weeks' && (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-emerald-700 uppercase">Cantidad de Semanas</label>
                                            <span className="text-sm font-black text-emerald-600">{recurringWeeks}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="2"
                                            max="52"
                                            value={recurringWeeks}
                                            onChange={(e) => setRecurringWeeks(parseInt(e.target.value))}
                                            className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                        />
                                        <p className="text-xs text-emerald-600 mt-2">
                                            Hasta el <span className="font-bold">{format(addDays(selectedDate, (recurringWeeks - 1) * 7), "d 'de' MMMM", { locale: es })}</span>
                                        </p>
                                    </div>
                                )}

                                {/* Info para semanal */}
                                {recurringType === 'weekly' && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center gap-2 text-amber-700 mb-2">
                                            <Repeat size={16} />
                                            <span className="font-bold text-sm">Reserva Semanal Indefinida</span>
                                        </div>
                                        <p className="text-amber-600 text-sm">
                                            El horario se reservará <strong>cada {format(selectedDate, 'EEEE', { locale: es })}</strong> a las {bookingMode.slot.hour}:00 de forma indefinida.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {bookingMode.mode === 'block' && (
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8">
                                <p className="text-amber-700 text-sm leading-relaxed">
                                    Este slot quedará marcado como no disponible para los clientes. Úselo para mantenimiento o eventos privados.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setBookingMode(null);
                                    setGuestInfo({ name: '', phone: '', price: '' });
                                    setIsRecurring(false);
                                    setRecurringType(null);
                                }}
                                className="flex-1 py-4 px-6 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                                disabled={isCreating}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleInternalReserve}
                                disabled={isCreating || (bookingMode.mode !== 'block' && !guestInfo.name)}
                                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                                    isCreating || (bookingMode.mode !== 'block' && !guestInfo.name)
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : bookingMode.mode === 'reserve' && recurringType === 'weekly'
                                            ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                                            : bookingMode.mode === 'reserve' && recurringType === 'weeks'
                                                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                                                : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                                }`}
                            >
                                {isCreating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <span>
                                        {bookingMode.mode === 'block' 
                                            ? 'Bloquear'
                                            : !recurringType
                                                ? 'Confirmar'
                                                : recurringType === 'weekly'
                                                    ? 'Crear Semanal'
                                                    : `${recurringWeeks} Semanas`}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog open={unlockConfirmOpen} onOpenChange={setUnlockConfirmOpen}>
                <AlertDialogContent className="rounded-[2rem] border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">
                            {slotToUnlock?.recurringId ? '¿Cancelar reserva semanal?' :
                             slotToUnlock?.seriesId ? '¿Eliminar serie?' : '¿Desbloquear horario?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base">
                            {slotToUnlock?.recurringId
                                ? "Esta acción cancelará la reserva semanal indefinida. El horario quedará disponible nuevamente."
                                : slotToUnlock?.seriesId
                                    ? "Este horario es parte de una serie. ¿Deseas eliminar solo esta fecha o la serie completa?"
                                    : "Esta acción eliminará la reserva y habilitará el horario nuevamente."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-2">
                        <AlertDialogCancel className="rounded-2xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600">
                            Cerrar
                        </AlertDialogCancel>

                        {slotToUnlock?.recurringId ? (
                            <button
                                onClick={confirmUnlockRecurring}
                                className="rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 py-3 px-6 transition-all"
                            >
                                Cancelar Reserva Semanal
                            </button>
                        ) : slotToUnlock?.seriesId ? (
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <button
                                    onClick={confirmUnlockSingle}
                                    className="flex-1 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 py-2 px-4 transition-all"
                                >
                                    Solo esta fecha
                                </button>
                                <button
                                    onClick={confirmUnlockSeries}
                                    className="flex-1 rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 py-2 px-4 transition-all"
                                >
                                    Toda la serie
                                </button>
                            </div>
                        ) : (
                            <AlertDialogAction
                                onClick={confirmUnlockSingle}
                                className="rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200"
                            >
                                Desbloquear
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
