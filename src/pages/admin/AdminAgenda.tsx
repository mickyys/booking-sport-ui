import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, Mail, Hash, Ban, LayoutDashboard, CalendarRange } from 'lucide-react';
import { format, addDays, subDays, startOfToday, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../../api/axiosInstance';

interface AdminAgendaProps {
    courts: any[];
}

export const AdminAgenda: React.FC<AdminAgendaProps> = ({ courts }) => {
    const { schedules, fetchSchedules, fetchAdminSchedules, weeklySchedules, selectedCenterId, isLoading: storeLoading } = useBookingStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
    const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
    const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);

    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (selectedCenterId && viewMode === 'daily') {
            // Usar endpoint admin protegido para obtener detalles de cliente
            (async () => {
                try {
                    await fetchAdminSchedules(selectedCenterId, format(selectedDate, 'yyyy-MM-dd'), getAccessTokenSilently);
                } catch (err) {
                    // Fallback público si falla (no bloqueamos UI)
                    await fetchSchedules(selectedCenterId, format(selectedDate, 'yyyy-MM-dd'));
                }
            })();
        }
    }, [selectedDate, selectedCenterId, fetchSchedules, fetchAdminSchedules, viewMode, getAccessTokenSilently]);

    useEffect(() => {
        const loadWeek = async () => {
            if (!selectedCenterId || !selectedCourtId || viewMode !== 'weekly') return;
            setIsWeeklyLoading(true);
            try {
                const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(selectedDate, i));
                await Promise.all(
                    weekDays.map(async (day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        try {
                            await fetchAdminSchedules(selectedCenterId, dateStr, getAccessTokenSilently);
                        } catch (err) {
                            // fallback público
                            await fetchSchedules(selectedCenterId, dateStr);
                        }
                    })
                );
            } catch (err) {
                console.error("Error loading week:", err);
            } finally {
                setIsWeeklyLoading(false);
            }
        };

        loadWeek();
    }, [selectedDate, selectedCenterId, selectedCourtId, viewMode]);

    useEffect(() => {
        if (courts.length > 0 && !selectedCourtId) {
            setSelectedCourtId(courts[0].id);
        }
    }, [courts, selectedCourtId]);

    const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
    const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
    const handleToday = () => setSelectedDate(new Date());

    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(selectedDate, i));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Agenda de Arriendos</h2>
                    <p className="text-slate-500 mt-1">Consulta rápida de ocupación por día y semana.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`flex-1 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            viewMode === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Vista Diaria
                    </button>
                    <button
                        onClick={() => setViewMode('weekly')}
                        className={`flex-1 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            viewMode === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Vista Semanal
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 mr-auto">
                    <button onClick={handlePrevDay} className="p-2 hover:bg-slate-50 rounded-full text-slate-600">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="date"
                            className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-200"
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                        />
                    </div>
                    <button onClick={handleNextDay} className="p-2 hover:bg-slate-50 rounded-full text-slate-600">
                        <ChevronRight size={20} />
                    </button>
                    <button
                        onClick={handleToday}
                        className="ml-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-100"
                    >
                        Hoy
                    </button>
                </div>

                {viewMode === 'weekly' && (
                    <select
                        className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-200"
                        value={selectedCourtId || ''}
                        onChange={(e) => setSelectedCourtId(e.target.value)}
                    >
                        {courts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {viewMode === 'daily' ? (
                storeLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="space-y-6">
                        {schedules.map(courtSchedule => (
                            <div key={courtSchedule.id} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                                    <h3 className="font-bold text-slate-900">{courtSchedule.name}</h3>
                                </div>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {courtSchedule.schedule.map((slot: any, idx: number) => (
                                        <SlotCard key={idx} slot={slot} />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {schedules.length === 0 && <EmptyState />}
                    </div>
                )
            ) : (
                isWeeklyLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                        {weekDays.map((day, idx) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const dayData = weeklySchedules && weeklySchedules[dateKey] ? weeklySchedules[dateKey] : [];
                            const court = dayData.find((c: any) => c.id === selectedCourtId);
                            return (
                                <WeeklyDayColumn
                                    key={idx}
                                    day={day}
                                    schedule={court ? court.schedule : []}
                                />
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
};

const SlotCard: React.FC<{ slot: any }> = ({ slot }) => {
    const isBooked = slot.status === 'booked' || slot.status === 'reserved' || slot.status === 'passed_booked';
    const isBlocked = slot.status === 'closed';
    const isPassed = slot.status === 'passed' && !isBooked;

    const isInternalBlock = slot.payment_method === 'internal_block';
    const isInternalReserva = slot.payment_method === 'internal_reservation';
    const isInternal = isInternalBlock || isInternalReserva;

    if (isBooked) {
        return (
            <div className={`p-4 rounded-2xl border space-y-2 ${slot.status === 'passed_booked' ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="flex justify-between items-center">
                    <span className={`text-sm font-black ${slot.status === 'passed_booked' ? 'text-slate-500' : 'text-emerald-700'}`}>{slot.hour}:00</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${slot.status === 'passed_booked' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isInternalBlock ? 'Bloqueo Interno' : isInternalReserva ? 'Reserva Interna' : (slot.status === 'passed_booked' ? 'Arrendado (Pasado)' : 'Reserva')}
                    </span>
                </div>
                <div className="space-y-1">
                    <div className={`flex items-center gap-2 ${slot.status === 'passed_booked' ? 'text-slate-700' : 'text-emerald-800'}`}>
                        <User size={12} className="shrink-0" />
                        <span className="text-xs font-bold truncate">{slot.customer_name || (isInternalBlock ? 'Bloqueo' : 'Cliente')}</span>
                    </div>
                    {slot.customer_phone && (
                        <div className={`flex items-center gap-2 ${slot.status === 'passed_booked' ? 'text-slate-500' : 'text-emerald-600'}`}>
                            <span className="text-[10px] font-bold">TEL:</span>
                            <span className="text-[10px] font-medium truncate">{slot.customer_phone}</span>
                        </div>
                    )}
                    {slot.customer_email && slot.customer_email !== 'admin@internal.com' && (
                        <div className={`flex items-center gap-2 ${slot.status === 'passed_booked' ? 'text-slate-500' : 'text-emerald-600'}`}>
                            <Mail size={12} className="shrink-0" />
                            <span className="text-[10px] font-medium truncate">{slot.customer_email}</span>
                        </div>
                    )}
                    <div className={`flex items-center gap-2 ${slot.status === 'passed_booked' ? 'text-slate-500' : 'text-emerald-600'}`}>
                        <Hash size={12} className="shrink-0" />
                        <span className="text-[10px] font-mono font-bold">{slot.booking_code || '---'}</span>
                    </div>
                    <div className="pt-1 mt-1 border-t border-emerald-100/50 flex justify-between items-center">
                        <span className={`text-[9px] font-bold uppercase ${isInternal ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {isInternal ? 'Cobro Presencial' : 'Pagado Online'}
                        </span>
                        <span className="text-[10px] font-black text-slate-900">
                            ${slot.price?.toLocaleString('es-CL')}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (isBlocked) {
        return (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 opacity-60">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400">{slot.hour}:00</span>
                    <Ban size={14} className="text-slate-400" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Bloqueado / Interno</p>
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-2xl border border-dashed transition-all ${isPassed ? 'bg-slate-50/50 border-slate-200 opacity-40' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
            <div className="flex justify-between items-center">
                <span className={`text-sm font-bold ${isPassed ? 'text-slate-400' : 'text-slate-900'}`}>{slot.hour}:00</span>
                {!isPassed && <span className="text-[10px] font-bold text-slate-400 uppercase">Disponible</span>}
            </div>
            {isPassed && <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Pasado</p>}
        </div>
    );
};

const WeeklyDayColumn: React.FC<{ day: Date, schedule: any[] }> = ({ day, schedule }) => {
    const [activeSlot, setActiveSlot] = useState<any | null>(null);

    return (
        <div className="space-y-3 min-w-0">
            <div className={`p-3 rounded-2xl text-center border transition-all ${isSameDay(day, new Date()) ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white border-slate-100 text-slate-900'}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{format(day, 'EEE', { locale: es })}</p>
                <p className="text-lg font-black">{format(day, 'd')}</p>
            </div>

            <div className="space-y-1.5">
                {schedule.length > 0 ? (
                    schedule.map((slot, idx) => {
                        const isBooked = slot.status === 'booked' || slot.status === 'reserved' || slot.status === 'passed_booked';
                        const isBlocked = slot.status === 'closed';
                        const isInternalBlock = slot.payment_method === 'internal_block';
                        const isInternalReserva = slot.payment_method === 'internal_reservation';
                        const isInternal = isInternalBlock || isInternalReserva;

                        return (
                            <div
                                key={idx}
                                onClick={() => isBooked ? setActiveSlot(activeSlot === slot ? null : slot) : null}
                                className={`relative p-2.5 rounded-xl border text-[10px] font-bold text-center transition-all cursor-pointer ${
                                    isBooked
                                        ? (isInternalBlock ? 'bg-slate-300 border-slate-300 text-slate-700' : (slot.status === 'passed_booked' ? 'bg-slate-400 border-slate-400 text-white opacity-75' : 'bg-emerald-500 border-emerald-500 text-white shadow-sm'))
                                        : isBlocked
                                        ? 'bg-slate-100 border-slate-200 text-slate-400'
                                        : 'bg-white border-slate-100 text-slate-400 border-dashed hover:border-slate-300'
                                }`}
                            >
                                {slot.hour}:00

                                {isBooked && activeSlot === slot && (
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 w-48 p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 text-slate-900 text-left animate-in zoom-in-95 duration-200">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className={slot.status === 'passed_booked' ? 'text-slate-400' : 'text-emerald-500'} />
                                                    <p className="text-[10px] font-black">{slot.hour}:00</p>
                                                </div>
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase ${isInternal ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {isInternal ? 'Presencial' : 'Pagado'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl mb-1">
                                                <span className="text-[9px] text-slate-500 font-bold uppercase">Valor Hora</span>
                                                <span className="text-[11px] font-black text-slate-900">${slot.price?.toLocaleString('es-CL')}</span>
                                            </div>

                                            {isInternalReserva && <p className="text-[8px] font-bold text-orange-600 uppercase mb-1">Reserva Interna</p>}
                                            <div className="flex items-center gap-2">
                                                <User size={10} className="text-slate-400 shrink-0" />
                                                <p className="text-[10px] font-bold truncate">{slot.customer_name || (isInternalBlock ? 'Bloqueo' : 'Cliente')}</p>
                                            </div>
                                            {slot.customer_phone && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-slate-400">TEL:</span>
                                                    <p className="text-[10px] text-slate-500 truncate">{slot.customer_phone}</p>
                                                </div>
                                            )}
                                            {slot.customer_email && slot.customer_email !== 'admin@internal.com' && (
                                                <div className="flex items-center gap-2">
                                                    <Mail size={10} className="text-slate-400 shrink-0" />
                                                    <p className="text-[10px] text-slate-500 truncate">{slot.customer_email}</p>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Hash size={10} className="text-slate-400 shrink-0" />
                                                <p className="text-[10px] font-mono text-slate-500">{slot.booking_code || '---'}</p>
                                            </div>
                                            
                                            <button
                                                className="w-full mt-2 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-bold uppercase hover:bg-slate-100"
                                                onClick={(e) => { e.stopPropagation(); setActiveSlot(null); }}
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-100 rotate-45" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-[10px] text-slate-300 font-medium">Sin horarios</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Cargando agenda...</p>
    </div>
);

const EmptyState = () => (
    <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
        <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <h4 className="text-slate-900 font-bold">No hay canchas configuradas</h4>
        <p className="text-slate-400 text-sm mt-1">Revisa la sección de canchas en el panel de administración.</p>
    </div>
);
