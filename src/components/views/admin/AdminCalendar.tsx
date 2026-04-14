"use client";
"use client";
import React, { useState, useEffect } from 'react';
import { Ban, Calendar, User, Phone, Unlock, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
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
        fetchSchedules,
        createInternalBooking,
        deleteBooking,
        deleteSeries,
        selectedCenterId
    } = useBookingStore();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
    const [bookingMode, setBookingMode] = useState<{ slot: any, mode: 'block' | 'reserve' } | null>(null);
    const [guestInfo, setGuestInfo] = useState({ name: '', phone: '' });
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringWeeks, setRecurringWeeks] = useState(4);
    const [isCreating, setIsCreating] = useState(false);

    // Unlock confirmation state
    const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
    const [slotToUnlock, setSlotToUnlock] = useState<{ bookingId?: string, seriesId?: string } | null>(null);

    useEffect(() => {
        // Obtenemos el centerId de la cancha seleccionada o del store
        const centerId = courts.find(c => c.id === selectedCourtId)?.centerId || selectedCenterId;
        if (centerId) {
            fetchSchedules(centerId, format(selectedDate, 'yyyy-MM-dd'));
        }
    }, [selectedDate, fetchSchedules, selectedCourtId]);

    useEffect(() => {
        if (courts.length > 0 && !selectedCourtId) {
            setSelectedCourtId(courts[0].id);
        }
    }, [courts, selectedCourtId]);

    const handleInternalReserve = async () => {
        if (!bookingMode) return;
        setIsCreating(true);

        const weeksToProcess = isRecurring ? recurringWeeks : 1;
        const successDates: string[] = [];
        const seriesId = isRecurring ? `SERIE-${crypto.randomUUID().slice(0, 8).toUpperCase()}` : undefined;

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

            toast.success(isRecurring 
                ? `Se crearon ${weeksToProcess} reservas con éxito` 
                : (bookingMode.mode === 'reserve' ? "Reserva guardada con éxito" : "Horario bloqueado")
            );
            
            setBookingMode(null);
            setGuestInfo({ name: '', phone: '' });
            setIsRecurring(false);
            setRecurringWeeks(4);
            
            if (selectedCenterId) {
                fetchSchedules(selectedCenterId, format(selectedDate, 'yyyy-MM-dd'));
            }
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

    const handleUnlock = (bookingId?: string, seriesId?: string) => {
        if (!bookingId) {
            toast.error("No se encontró el ID de la reserva para desbloquear");
            return;
        }
        setSlotToUnlock({ bookingId, seriesId });
        setUnlockConfirmOpen(true);
    };

    const confirmUnlockSingle = async () => {
        if (!slotToUnlock?.bookingId) return;
        try {
            await deleteBooking(slotToUnlock.bookingId, getAccessTokenSilently);
            toast.success("Horario desbloqueado con éxito");
            if (selectedCenterId) {
                fetchSchedules(selectedCenterId, format(selectedDate, 'yyyy-MM-dd'));
            }
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
            if (selectedCenterId) {
                fetchSchedules(selectedCenterId, format(selectedDate, 'yyyy-MM-dd'));
            }
        } catch (error) {
            toast.error("Error al desbloquear toda la serie");
        } finally {
            setUnlockConfirmOpen(false);
            setSlotToUnlock(null);
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
            </div>

            {/* Header / Filtros */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-6 items-end">
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
            </div>

            {/* Grid de Horarios */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {slots.map((slot, index) => {
                    const isBooked = slot.status === 'booked' || slot.status === 'reserved';
                    const isPassed = slot.status === 'passed';
                    const isClosed = slot.status === 'closed';

                    return (
                        <div
                            key={index}
                            className={`p-4 rounded-3xl border transition-all duration-300 ${isBooked
                                    ? 'bg-slate-50 border-slate-200'
                                    : isClosed || isPassed
                                        ? 'bg-red-50 border-red-100 grayscale opacity-60'
                                        : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 group'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-3 text-center">
                                <span className={`text-lg font-bold ${isBooked ? 'text-slate-400' : 'text-slate-900'}`}>
                                    {String(slot.hour).padStart(2, '0')}:00
                                </span>

                                {isBooked ? (
                                    <button
                                        onClick={() => handleUnlock(slot.booking_id, slot.series_id)}
                                        className={`text-xs font-bold flex items-center gap-1 py-2 px-3 rounded-xl transition-colors ${
                                            slot.series_id 
                                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-200' 
                                            : 'text-red-500 bg-red-50 hover:bg-red-100'
                                        }`}
                                    >
                                        {slot.series_id ? <Clock size={12} className="animate-pulse" /> : <Unlock size={12} />}
                                        {slot.series_id ? 'Ver Serie' : 'Desbloquear'}
                                    </button>
                                ) : isClosed || isPassed ? (
                                    <span className="text-xs font-bold text-red-400 py-2">{isPassed ? 'Pasado' : 'Cerrado'}</span>
                                ) : (
                                    <div className="flex flex-col w-full gap-2">
                                        <button
                                            onClick={() => setBookingMode({ slot: { ...slot, courtId: selectedCourtId }, mode: 'reserve' })}
                                            className="w-full text-[10px] font-bold bg-slate-900 text-white py-2 rounded-xl hover:bg-emerald-500 transition-all"
                                        >
                                            Reservar
                                        </button>
                                        <button
                                            onClick={() => setBookingMode({ slot: { ...slot, courtId: selectedCourtId }, mode: 'block' })}
                                            className="w-full text-[10px] font-bold text-slate-500 py-1.5 rounded-xl hover:bg-slate-50 transition-all border border-slate-100"
                                        >
                                            Bloquear
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {slots.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                        <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h4 className="text-slate-900 font-bold">No hay horarios disponibles</h4>
                        <p className="text-slate-400 text-sm mt-1">Selecciona otra fecha o revisa la configuración de la cancha</p>
                    </div>
                )}
            </div>

            {/* Modal de Reserva Interna */}
            {bookingMode && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {bookingMode.mode === 'reserve' ? 'Reserva Interna' : 'Bloquear Horario'}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    <span className="font-bold text-slate-900">{format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</span> a las {bookingMode.slot.hour}:00
                                </p>
                            </div>
                        </div>

                        {bookingMode.mode === 'reserve' && (
                            <div className="space-y-4 mb-8">
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
                        )}

                        {bookingMode.mode === 'block' && (
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8">
                                <p className="text-amber-700 text-sm leading-relaxed">
                                    Este slot quedará marcado como no disponible para los clientes. Úselo para mantenimiento o eventos privados.
                                </p>
                            </div>
                        )}

                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700">Hacer recurrente</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                            
                            {isRecurring && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cantidad de Semanas</label>
                                        <span className="text-sm font-black text-emerald-600">{recurringWeeks}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="2"
                                        max="52"
                                        value={recurringWeeks}
                                        onChange={(e) => setRecurringWeeks(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                        Se crearán reservas automáticas para cada <span className="font-bold text-slate-600">{format(selectedDate, 'EEEE', { locale: es })}</span> por las próximas {recurringWeeks} semanas (Hasta el <span className="font-bold text-slate-600">{format(addDays(selectedDate, (recurringWeeks - 1) * 7), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>).
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setBookingMode(null);
                                    setIsRecurring(false);
                                }}
                                className="flex-1 py-4 px-6 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                                disabled={isCreating}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleInternalReserve}
                                disabled={isCreating}
                                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                                    isCreating ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                                }`}
                            >
                                {isCreating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <span>{isRecurring ? `Crear ${recurringWeeks} Reservas` : 'Confirmar'}</span>
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
                            {slotToUnlock?.seriesId ? '¿Eliminar serie?' : '¿Desbloquear horario?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base">
                            {slotToUnlock?.seriesId 
                                ? "Este horario es parte de una serie. ¿Deseas eliminar solo esta fecha o la serie completa?" 
                                : "Esta acción eliminará la reserva y habilitará el horario nuevamente."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-2">
                        <AlertDialogCancel className="rounded-2xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600">
                            Cerrar
                        </AlertDialogCancel>
                        
                        {slotToUnlock?.seriesId ? (
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
