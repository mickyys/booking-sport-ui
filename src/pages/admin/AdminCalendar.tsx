import React, { useState, useEffect } from 'react';
import { Ban, Calendar, User, Phone, Unlock, CheckCircle, Clock } from 'lucide-react';
import { format, startOfToday, addDays } from 'date-fns';
import { TimeSlot } from '../../types';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';

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
        selectedCenterId
    } = useBookingStore();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
    const [bookingMode, setBookingMode] = useState<{ slot: any, mode: 'block' | 'reserve' } | null>(null);
    const [guestInfo, setGuestInfo] = useState({ name: '', phone: '' });

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

        try {
            const bookingData = {
                court_id: bookingMode.slot.courtId,
                date: selectedDate.toISOString(),
                hour: bookingMode.slot.hour,
                guest_details: bookingMode.mode === 'reserve' ? {
                    name: guestInfo.name,
                    phone: guestInfo.phone,
                    email: 'admin@internal.com'
                } : null,
                status: 'confirmed',
                payment_method: 'internal'
            };

            await createInternalBooking(bookingData, getAccessTokenSilently);
            toast.success(bookingMode.mode === 'reserve' ? "Reserva guardada con éxito" : "Horario bloqueado");
            setBookingMode(null);
            setGuestInfo({ name: '', phone: '' });
            if (selectedCenterId) {
                fetchSchedules(selectedCenterId, format(selectedDate, 'yyyy-MM-dd'));
            }
        } catch (error) {
            toast.error("Error al realizar la acción");
        }
    };

    const handleUnlock = async (bookingId?: string) => {
        if (!bookingId) {
            toast.error("No se encontró el ID de la reserva para desbloquear");
            return;
        }

        if (!confirm("¿Estás seguro de que deseas desbloquear este horario? La reserva será eliminada.")) return;

        try {
            await deleteBooking(bookingId, getAccessTokenSilently);
            toast.success("Horario desbloqueado con éxito");
            if (selectedCenterId) {
                fetchSchedules(selectedCenterId, format(selectedDate, 'yyyy-MM-dd'));
            }
        } catch (error) {
            toast.error("Error al desbloquear");
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
                                        onClick={() => handleUnlock(slot.booking_id)}
                                        className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 py-2 px-3 bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Unlock className="w-3 h-3" /> Desbloquear
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
                                    {format(selectedDate, 'EEEE d \'de\' MMMM', { locale: undefined })} a las {bookingMode.slot.hour}:00
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

                        <div className="flex gap-3">
                            <button
                                onClick={() => setBookingMode(null)}
                                className="flex-1 py-4 px-6 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleInternalReserve}
                                className="flex-1 py-4 px-6 rounded-2xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
