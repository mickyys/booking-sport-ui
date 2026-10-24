"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Ban,
    CalendarDays,
    Clock,
    Loader2,
    Phone,
    Repeat,
    User,
    X,
} from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '@/store/useBookingStore';

export type AdminBookingTarget = {
    dateKey: string;
    hour: number;
    minutes: number;
};

type BookingMode = 'reserve' | 'block';
type RecurringType = 'single' | 'weeks' | 'weekly';

interface AdminBookingModalProps {
    target: AdminBookingTarget;
    courts: { id: string; name: string }[];
    initialCourtId: string | null;
    centerId: string | null;
    /** weeklySchedules del store: { [yyyy-MM-dd]: courts[] } */
    schedulesByDate: Record<string, any[]>;
    onClose: () => void;
    onCreated: (kind: BookingMode) => void;
}

const pad = (value: number) => String(value).padStart(2, '0');
const slotKey = (hour: number, minutes = 0) => `${hour}:${minutes}`;
const toApiDate = (dateKey: string) => `${dateKey}T12:00:00Z`;

export const AdminBookingModal: React.FC<AdminBookingModalProps> = ({
    target,
    courts,
    initialCourtId,
    centerId,
    schedulesByDate,
    onClose,
    onCreated,
}) => {
    const { getAccessTokenSilently } = useAuth0();
    const {
        createInternalBooking,
        createRecurringReservation,
        fetchAdminSchedulesRange,
    } = useBookingStore();

    const requestedDates = useRef<Set<string>>(new Set());

    const [courtId, setCourtId] = useState<string>(
        initialCourtId || courts[0]?.id || ''
    );
    const [dateKey, setDateKey] = useState<string>(target.dateKey);
    const [mode, setMode] = useState<BookingMode>('reserve');
    const [recurringType, setRecurringType] = useState<RecurringType>('single');
    const [recurringWeeks, setRecurringWeeks] = useState(4);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [timeValue, setTimeValue] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Si la fecha elegida no está cargada en la agenda, se pide al backend.
    useEffect(() => {
        if (!centerId || !dateKey) return;
        const day = schedulesByDate?.[dateKey];
        if (day && day.length > 0) return;
        const requestKey = `${centerId}|${dateKey}`;
        if (requestedDates.current.has(requestKey)) return;
        requestedDates.current.add(requestKey);
        fetchAdminSchedulesRange(centerId, dateKey, dateKey, getAccessTokenSilently);
    }, [dateKey, centerId, schedulesByDate, fetchAdminSchedulesRange, getAccessTokenSilently]);

    const slotOptions = useMemo(() => {
        const day = schedulesByDate?.[dateKey] || [];
        const court = (day || []).find((c: any) => String(c.id) === String(courtId));
        const schedule = (court?.schedule || []) as any[];
        const now = Date.now();

        return schedule
            .filter((slot) => {
                if (slot.status !== 'available' && slot.status !== 'unavailable') return false;
                const start = new Date(
                    `${dateKey}T${pad(slot.hour)}:${pad(slot.minutes || 0)}:00`
                ).getTime();
                return start > now;
            })
            .map((slot) => ({
                hour: slot.hour as number,
                minutes: (slot.minutes || 0) as number,
                price: (slot.price || 0) as number,
            }))
            .sort((a, b) => a.hour * 60 + a.minutes - (b.hour * 60 + b.minutes));
    }, [schedulesByDate, dateKey, courtId]);

    const effectiveTime = useMemo(() => {
        if (slotOptions.length === 0) return '';
        if (timeValue && slotOptions.some((s) => slotKey(s.hour, s.minutes) === timeValue)) {
            return timeValue;
        }
        const targetMinutes = target.hour * 60 + target.minutes;
        const atOrAfter = slotOptions.find((s) => s.hour * 60 + s.minutes >= targetMinutes);
        return slotKey(
            (atOrAfter || slotOptions[0]).hour,
            (atOrAfter || slotOptions[0]).minutes
        );
    }, [timeValue, slotOptions, target]);

    const selectedSlot = slotOptions.find(
        (s) => slotKey(s.hour, s.minutes) === effectiveTime
    );

    const canSubmit =
        !!courtId &&
        !!selectedSlot &&
        (mode === 'block' || name.trim().length > 0) &&
        !isCreating;

    const resetAndClose = () => {
        if (isCreating) return;
        onClose();
    };

    const handleSubmit = async () => {
        if (!selectedSlot || !courtId) {
            toast.error('No hay un horario disponible para reservar');
            return;
        }
        if (mode === 'reserve' && !name.trim()) {
            toast.error('Ingresa el nombre del cliente');
            return;
        }

        setIsCreating(true);
        const guestDetails =
            mode === 'reserve'
                ? {
                      name: name.trim(),
                      phone: phone.trim(),
                      email: 'admin@internal.com',
                  }
                : null;

        let created = 0;
        try {
            if (mode === 'reserve' && recurringType === 'weekly') {
                await createRecurringReservation(
                    {
                        court_id: courtId,
                        customer_name: name.trim(),
                        customer_phone: phone.trim(),
                        hour: selectedSlot.hour,
                        minutes: selectedSlot.minutes,
                        price: selectedSlot.price,
                        notes: '',
                        date: dateKey,
                    },
                    getAccessTokenSilently
                );
                onCreated(mode);
                return;
            }

            const weeksToProcess = mode === 'reserve' && recurringType === 'weeks' ? recurringWeeks : 1;
            const seriesId =
                weeksToProcess > 1
                    ? `SERIE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
                    : undefined;
            const baseDate = parseISO(`${dateKey}T12:00:00`);

            for (let i = 0; i < weeksToProcess; i++) {
                const bookingDate = format(addDays(baseDate, i * 7), 'yyyy-MM-dd');
                await createInternalBooking(
                    {
                        court_id: courtId,
                        date: toApiDate(bookingDate),
                        hour: selectedSlot.hour,
                        minutes: selectedSlot.minutes,
                        customer_name: mode === 'reserve' ? name.trim() : '',
                        customer_phone: mode === 'reserve' ? phone.trim() : '',
                        guest_details: guestDetails,
                        status: 'confirmed',
                        payment_method: 'internal',
                        series_id: seriesId,
                    },
                    getAccessTokenSilently
                );
                created += 1;
            }

            toast.success(
                mode === 'block'
                    ? 'Horario bloqueado con éxito'
                    : weeksToProcess > 1
                        ? `Se crearon ${weeksToProcess} reservas con éxito`
                        : 'Reserva creada con éxito'
            );
            onCreated(mode);
        } catch (error) {
            console.error('Error creating admin booking:', error);
            if (created > 0) {
                toast.error(
                    `Error parcial: solo se crearon ${created} de ${recurringWeeks} reservas`
                );
                onCreated(mode);
                return;
            }
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                toast.error(
                    error.response?.data?.error ||
                        'El horario ya no está disponible. Actualiza el calendario.'
                );
            } else if (!(mode === 'reserve' && recurringType === 'weekly')) {
                toast.error('Error al crear la reserva. Verifica la disponibilidad.');
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-6 max-w-md w-full max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-300 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6">
                <span className="sm:hidden block mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            {mode === 'block' ? (
                                <Ban size={20} className="text-slate-600" />
                            ) : (
                                <CalendarDays size={20} className="text-emerald-600" />
                            )}
                        </span>
                        <div>
                            <h3 className="text-xl font-black text-slate-900">
                                {mode === 'block' ? 'Bloquear horario' : 'Nueva reserva'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {format(parseISO(`${dateKey}T12:00:00`), "EEEE d 'de' MMMM", {
                                    locale: es,
                                })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={resetAndClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        aria-label="Cerrar"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                                Cancha
                            </label>
                            <select
                                value={courtId}
                                onChange={(e) => setCourtId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-200 outline-none"
                            >
                                {courts.map((court) => (
                                    <option key={court.id} value={court.id}>
                                        {court.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={dateKey}
                                onChange={(e) => e.target.value && setDateKey(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-200 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                            Hora
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select
                                value={effectiveTime}
                                onChange={(e) => setTimeValue(e.target.value)}
                                disabled={slotOptions.length === 0}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-200 outline-none disabled:text-slate-400"
                            >
                                {slotOptions.length === 0 && (
                                    <option value="">Sin horarios disponibles</option>
                                )}
                                {slotOptions.map((slot) => (
                                    <option key={slotKey(slot.hour, slot.minutes)} value={slotKey(slot.hour, slot.minutes)}>
                                        {pad(slot.hour)}:{pad(slot.minutes)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setMode('reserve')}
                            className={`py-3 rounded-2xl text-sm font-bold border transition-all ${
                                mode === 'reserve'
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            Reserva
                        </button>
                        <button
                            onClick={() => setMode('block')}
                            className={`py-3 rounded-2xl text-sm font-bold border transition-all ${
                                mode === 'block'
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            Bloqueo
                        </button>
                    </div>

                    {mode === 'reserve' && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                                    Nombre del cliente
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ej. Juan Pérez"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-200 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                                    Teléfono
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Ej. +569 1234 5678"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-200 outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {mode === 'reserve' && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                                Tipo de reserva
                            </label>
                            {[
                                { key: 'single' as const, label: 'Simple', hint: 'Solo esta fecha' },
                                { key: 'weeks' as const, label: 'Por semanas', hint: 'Se repite N semanas' },
                                { key: 'weekly' as const, label: 'Semanal', hint: 'Indefinida' },
                            ].map((option) => (
                                <button
                                    key={option.key}
                                    onClick={() => setRecurringType(option.key)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left transition-all ${
                                        recurringType === option.key
                                            ? 'bg-white ring-2 ring-emerald-500'
                                            : 'hover:bg-white/70'
                                    }`}
                                >
                                    <span className="text-sm font-bold text-slate-800">
                                        {option.label}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        {option.hint}
                                    </span>
                                </button>
                            ))}

                            {recurringType === 'weeks' && (
                                <div className="pt-1">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-bold text-slate-500">Semanas</span>
                                        <span className="text-sm font-black text-emerald-600">
                                            {recurringWeeks}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="2"
                                        max="52"
                                        value={recurringWeeks}
                                        onChange={(e) => setRecurringWeeks(parseInt(e.target.value, 10))}
                                        className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <p className="text-xs text-emerald-600 mt-1.5">
                                        Hasta el{' '}
                                        <span className="font-bold">
                                            {format(
                                                addDays(parseISO(`${dateKey}T12:00:00`), (recurringWeeks - 1) * 7),
                                                "d 'de' MMMM",
                                                { locale: es }
                                            )}
                                        </span>
                                    </p>
                                </div>
                            )}

                            {recurringType === 'weekly' && (
                                <div className="flex items-start gap-2 pt-1 text-amber-600">
                                    <Repeat size={15} className="mt-0.5 shrink-0" />
                                    <p className="text-xs font-semibold">
                                        Se reservará cada {format(parseISO(`${dateKey}T12:00:00`), 'EEEE', { locale: es })}{' '}
                                        a las {effectiveTime.split(':').map((v) => pad(Number(v))).join(':')} de forma indefinida.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'block' && (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                            <p className="text-amber-700 text-sm leading-relaxed">
                                El horario quedará no disponible para los clientes. Úsalo para
                                mantenimiento o eventos privados.
                            </p>
                        </div>
                    )}

                    {selectedSlot && (
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                Valor del bloque
                            </span>
                            <span className="text-base font-black text-slate-900">
                                ${selectedSlot.price.toLocaleString('es-CL')}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                    <button
                        onClick={resetAndClose}
                        disabled={isCreating}
                        className="flex-1 py-3.5 px-6 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                            !canSubmit
                                ? 'bg-slate-400 cursor-not-allowed'
                                : mode === 'block'
                                    ? 'bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200'
                                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200'
                        }`}
                    >
                        {isCreating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <span>
                                {mode === 'block'
                                    ? 'Bloquear'
                                    : recurringType === 'weekly'
                                        ? 'Crear semanal'
                                        : recurringType === 'weeks'
                                            ? `Crear ${recurringWeeks} semanas`
                                            : 'Confirmar reserva'}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
