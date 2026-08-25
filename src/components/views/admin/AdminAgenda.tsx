"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { CalendarOptions } from '@fullcalendar/core';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
    ssr: false,
}) as unknown as React.ForwardRefExoticComponent<
    CalendarOptions & React.RefAttributes<{ getApi: () => any }>
>;
import { format, addDays, startOfDay } from 'date-fns';
import { es as esFns } from 'date-fns/locale';
import {
    CalendarDays,
    CalendarRange,
    ChevronLeft,
    ChevronRight,
    User,
    Phone,
    Hash,
    Repeat,
    Clock,
    AlertCircle,
    RotateCcw,
    Ban,
    X,
    Loader2,
    Banknote,
} from 'lucide-react';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';
import { useAdminPanel } from '@/context/AdminPanelContext';
import { toast } from 'sonner';
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

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

const VIEWS: { key: ViewType; label: string }[] = [
    { key: 'dayGridMonth', label: 'Mes' },
    { key: 'timeGridWeek', label: 'Semana' },
    { key: 'timeGridDay', label: 'Día' },
];

const COURT_PALETTE = [
    { solid: '#059669', soft: '#d1fae5' },
    { solid: '#4f46e5', soft: '#e0e7ff' },
    { solid: '#0891b2', soft: '#cffafe' },
    { solid: '#d97706', soft: '#fde68a' },
    { solid: '#db2777', soft: '#fbcfe8' },
    { solid: '#7c3aed', soft: '#ddd6fe' },
    { solid: '#0d9488', soft: '#99f6e4' },
    { solid: '#2563eb', soft: '#bfdbfe' },
    { solid: '#ea580c', soft: '#fed7aa' },
];

type SlotData = {
    hour: number;
    minutes?: number;
    price?: number;
    status?: string;
    booking_id?: string;
    booking_code?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    series_id?: string;
    payment_method?: string;
    isPartialPayment?: boolean;
    partialPaymentPaid?: boolean;
    paidAmount?: number;
    pendingAmount?: number;
};

const getSlotLabel = (slot: SlotData): string => {
    const status = slot.status;
    if (slot.payment_method === 'internal_block') return 'Bloqueo';
    if (slot.payment_method === 'internal_reservation') return 'Interna';
    if (slot.payment_method === 'presential') return 'Presencial';
    if (status === 'recurring_booked') return 'Recurrente';
    if (status === 'passed_booked') return 'Pasado';
    if (status === 'closed') return 'Bloqueado';
    return 'Online';
};

const isInternalSlot = (slot: SlotData): boolean =>
    slot.payment_method === 'internal_block' ||
    slot.payment_method === 'internal_reservation' ||
    slot.payment_method === 'presential';

export const AdminAgenda: React.FC = () => {
    const {
        weeklySchedules,
        selectedCenterId,
        isLoading: storeLoading,
        payBalance,
        undoPayBalance,
        fetchAdminSchedulesRange,
    } = useBookingStore();
    const { getAccessTokenSilently } = useAuth0();
    const { courts: contextCourts, currentSportCenter } = useAdminPanel();

    const calendarRef = useRef<any>(null);
    const fetchRef = useRef<string>('');

    const [viewType, setViewType] = useState<ViewType>('timeGridWeek');
    const [viewTitle, setViewTitle] = useState('');
    const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);
    const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

    const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
    const [showConfirmPay, setShowConfirmPay] = useState<SlotData | null>(null);
    const [showConfirmUndo, setShowConfirmUndo] = useState<SlotData | null>(null);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const centerId = currentSportCenter?.id || currentSportCenter?._id || selectedCenterId || null;

    const courts = useMemo(() => {
        const seen = new Set<string>();
        const list: { id: string; name: string }[] = [];
        const push = (id: any, name: any) => {
            if (!id || seen.has(String(id))) return;
            seen.add(String(id));
            list.push({ id: String(id), name: name || 'Cancha' });
        };
        (contextCourts || []).forEach((c: any) => push(c.id || c._id, c.name));
        Object.values(weeklySchedules || {}).forEach((cs: any) =>
            (cs || []).forEach((c: any) => push(c.id, c.name))
        );
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [contextCourts, weeklySchedules]);

    const courtColorIndex = useCallback(
        (courtId: string): number => {
            const idx = courts.findIndex((c) => c.id === String(courtId));
            return idx < 0 ? 0 : idx % COURT_PALETTE.length;
        },
        [courts]
    );

    const handleDatesSet = useCallback((arg: any) => {
        setVisibleRange({ start: arg.start, end: arg.end });
        setViewType(arg.view.type);
        setViewTitle(arg.view.title);
    }, []);

    useEffect(() => {
        if (!centerId || !visibleRange) return;
        const from = format(visibleRange.start, 'yyyy-MM-dd');
        const to = format(addDays(visibleRange.end, -1), 'yyyy-MM-dd');
        const key = `${centerId}|${from}|${to}`;
        if (fetchRef.current === key) return;
        fetchRef.current = key;
        fetchAdminSchedulesRange(centerId, from, to, getAccessTokenSilently);
    }, [visibleRange, centerId, fetchAdminSchedulesRange, getAccessTokenSilently]);

    const events = useMemo(() => {
        if (!visibleRange) return [];
        const list: any[] = [];
        const fromT = startOfDay(visibleRange.start).getTime();
        const toT = startOfDay(visibleRange.end).getTime();

        Object.entries(weeklySchedules || {}).forEach(([dateKey, cs]) => {
            const t = startOfDay(new Date(dateKey + 'T00:00:00')).getTime();
            if (t < fromT || t >= toT) return;
            (cs || []).forEach((court: any) => {
                if (selectedCourtId && String(court.id) !== String(selectedCourtId)) return;
                (court.schedule || []).forEach((slot: any) => {
                    const status = slot.status;
                    const isClosed = status === 'closed';
                    const isPassed = status === 'passed_booked';
                    const isRecurring = status === 'recurring_booked';
                    const isBooked =
                        ['booked', 'reserved', 'unavailable'].includes(status) ||
                        isPassed ||
                        isRecurring;
                    if (!isBooked && !isClosed) return;

                    const hh = String(slot.hour).padStart(2, '0');
                    const mm = String(slot.minutes || 0).padStart(2, '0');
                    const start = `${dateKey}T${hh}:${mm}:00`;
                    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000);

                    const title = isClosed
                        ? 'Bloqueado'
                        : slot.payment_method === 'internal_block'
                            ? 'Bloqueo'
                            : slot.customer_name || court.name || 'Reserva';

                    list.push({
                        id: `${court.id}-${dateKey}-${hh}-${mm}`,
                        title,
                        start,
                        end: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
                        extendedProps: {
                            courtId: String(court.id),
                            courtName: court.name,
                            slot,
                            isBooked,
                            isClosed,
                        },
                    });
                });
            });
        });
        return list;
    }, [weeklySchedules, visibleRange, selectedCourtId]);

    const stats = useMemo(() => {
        let booked = 0;
        let pending = 0;
        let blocked = 0;
        events.forEach((ev) => {
            const slot: SlotData = ev.extendedProps.slot;
            if (ev.extendedProps.isClosed) blocked++;
            else if (ev.extendedProps.isBooked) {
                booked++;
                if (slot.isPartialPayment && !slot.partialPaymentPaid) pending++;
            }
        });
        return { booked, pending, blocked };
    }, [events]);

    const calendarApi = () => calendarRef.current?.getApi();

    const goPrev = () => calendarApi()?.prev();
    const goNext = () => calendarApi()?.next();
    const goToday = () => calendarApi()?.today();
    const changeView = (v: ViewType) => calendarApi()?.changeView(v);

    const handleEventClick = useCallback((info: any) => {
        const p = info.event.extendedProps;
        if (!p.isBooked || !p.slot) return;
        const dateStr = format(info.event.start, 'yyyy-MM-dd');
        setSelectedSlot({ ...p.slot, __date: dateStr } as any);
    }, []);

    const renderEventContent = useCallback(
        (info: any) => {
            const p = info.event.extendedProps;
            const slot: SlotData = p.slot || {};
            const palette = COURT_PALETTE[courtColorIndex(p.courtId)];
            const isInternal = isInternalSlot(slot);
            const hasPending = slot.isPartialPayment && !slot.partialPaymentPaid;
            const label = getSlotLabel(slot);
            const isMonth = String(info.view.type).startsWith('dayGrid');

            const baseStyle: React.CSSProperties = {
                background: p.isClosed || slot.payment_method === 'internal_block' ? '#f1f5f9' : palette.soft,
                borderLeft: `3px solid ${p.isClosed || slot.payment_method === 'internal_block' ? '#94a3b8' : palette.solid}`,
                opacity: slot.status === 'passed_booked' ? 0.7 : 1,
            };

            if (isMonth) {
                return (
                    <div
                        style={baseStyle}
                        className="rl-pill rl-pill--month"
                    >
                        {slot.status === 'recurring_booked' && (
                            <Repeat size={9} className="shrink-0" style={{ color: palette.solid }} />
                        )}
                        <span className="font-black" style={{ color: palette.solid }}>
                            {info.timeText}
                        </span>
                        <span className="font-semibold truncate flex-1">{info.event.title}</span>
                        {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                    </div>
                );
            }

            return (
                <div
                    style={baseStyle}
                    className="rl-pill rl-pill--time"
                >
                    <div className="flex items-center justify-between gap-1">
                        <span className="font-black" style={{ color: palette.solid }}>
                            {info.timeText}
                        </span>
                        <span
                            className={`text-[8px] uppercase font-bold px-1 py-px rounded-full ${
                                hasPending
                                    ? 'bg-rose-100 text-rose-600'
                                    : isInternal
                                        ? 'bg-indigo-100 text-indigo-600'
                                        : slot.status === 'recurring_booked'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-slate-200/70 text-slate-600'
                            }`}
                        >
                            {hasPending ? 'Pendiente' : label}
                        </span>
                    </div>
                    <div className="text-[11px] font-bold truncate text-slate-800">{info.event.title}</div>
                    <div className="text-[9px] font-semibold text-slate-500 truncate">{p.courtName}</div>
                </div>
            );
        },
        [courtColorIndex]
    );

    const handlePayBalanceClick = (slot: SlotData) => {
        if (!slot.booking_id) return;
        setSelectedSlot(null);
        setShowConfirmPay(slot);
    };

    const handleUndoPayBalanceClick = (slot: SlotData) => {
        if (!slot.booking_id) return;
        setSelectedSlot(null);
        setShowConfirmUndo(slot);
    };

    const handleConfirmPay = async () => {
        if (!showConfirmPay?.booking_id) return;
        const bId = showConfirmPay.booking_id;
        setIsProcessing(bId);
        try {
            await payBalance(bId, getAccessTokenSilently);
            toast.success("Saldo cobrado con éxito");
            showConfirmPay.partialPaymentPaid = true;
            showConfirmPay.pendingAmount = 0;
        } catch (error) {
            toast.error("Error al cobrar saldo");
        } finally {
            setIsProcessing(null);
            setShowConfirmPay(null);
        }
    };

    const handleConfirmUndo = async () => {
        if (!showConfirmUndo?.booking_id) return;
        const bId = showConfirmUndo.booking_id;
        setIsProcessing(bId);
        try {
            await undoPayBalance(bId, getAccessTokenSilently);
            toast.success("Cobro deshecho con éxito");
            showConfirmUndo.partialPaymentPaid = false;
            showConfirmUndo.pendingAmount = (showConfirmUndo.price || 0) - (showConfirmUndo.paidAmount || 0);
        } catch (error) {
            toast.error("Error al deshacer cobro");
        } finally {
            setIsProcessing(null);
            setShowConfirmUndo(null);
        }
    };

    const selectedSlotDate = selectedSlot ? new Date((selectedSlot as any).__date + 'T00:00:00') : null;

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 p-6 sm:p-8 shadow-xl shadow-emerald-600/10">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-emerald-300/20 blur-2xl" />
                <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold uppercase tracking-wider mb-3">
                            <CalendarRange size={14} />
                            Agenda de Arriendos
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Gestiona tus arriendos
                        </h2>
                        <p className="text-emerald-100/90 mt-1">
                            Reservas, bloqueos y pagos pendientes en un solo calendario.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <CalendarDays size={18} className="text-white" />
                            </span>
                            <div>
                                <p className="text-2xl font-black text-white leading-none">{stats.booked}</p>
                                <p className="text-[10px] font-bold text-emerald-100/80 uppercase tracking-wider mt-1">Reservas</p>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <AlertCircle size={18} className="text-rose-200" />
                            </span>
                            <div>
                                <p className="text-2xl font-black text-white leading-none">{stats.pending}</p>
                                <p className="text-[10px] font-bold text-emerald-100/80 uppercase tracking-wider mt-1">Pendientes</p>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white/15 backdrop-blur px-4 py-3 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Ban size={18} className="text-slate-200" />
                            </span>
                            <div>
                                <p className="text-2xl font-black text-white leading-none">{stats.blocked}</p>
                                <p className="text-[10px] font-bold text-emerald-100/80 uppercase tracking-wider mt-1">Bloqueos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={goPrev}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
                        aria-label="Anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={goToday}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={goNext}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
                        aria-label="Siguiente"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-900 capitalize min-w-[180px] text-center">
                    {viewTitle || 'Cargando...'}
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {VIEWS.map((v) => (
                            <button
                                key={v.key}
                                onClick={() => changeView(v.key)}
                                className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                                    viewType === v.key
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>

                    <select
                        value={selectedCourtId || ''}
                        onChange={(e) => setSelectedCourtId(e.target.value || null)}
                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-200 outline-none"
                    >
                        <option value="">Todas las canchas</option>
                        {courts.map((c) => {
                            const palette = COURT_PALETTE[courtColorIndex(c.id)];
                            return (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Online
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Interna
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Recurrente
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Bloqueo
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Saldo pendiente
                </span>
            </div>

            {/* Calendario */}
            <div className="relative bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                {storeLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                        <p className="text-sm font-bold text-slate-500">Cargando agenda...</p>
                    </div>
                )}
                <div className="rl-calendar">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        locale={esLocale}
                        events={events}
                        eventContent={renderEventContent}
                        eventClick={handleEventClick}
                        datesSet={handleDatesSet}
                        headerToolbar={false}
                        height="auto"
                        slotMinTime="08:00:00"
                        slotMaxTime="23:00:00"
                        allDaySlot={false}
                        nowIndicator
                        dayMaxEvents={4}
                        firstDay={1}
                        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                        eventDisplay="block"
                        buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
                    />
                </div>
            </div>

            {/* Modal detalle de reserva */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-5">
                            <div className="flex items-center gap-3">
                                <span className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                    <User size={20} className="text-emerald-600" />
                                </span>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">
                                        {selectedSlot.customer_name || 'Reserva'}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {selectedSlotDate ? format(selectedSlotDate, "EEEE d 'de' MMMM", { locale: esFns }) : ''} · {String(selectedSlot.hour).padStart(2, '0')}:{String(selectedSlot.minutes || 0).padStart(2, '0')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSlot(null)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <Clock size={15} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Estado</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    getSlotLabel(selectedSlot) === 'Pendiente' || (selectedSlot.isPartialPayment && !selectedSlot.partialPaymentPaid)
                                        ? 'bg-rose-100 text-rose-600'
                                        : isInternalSlot(selectedSlot)
                                            ? 'bg-indigo-100 text-indigo-600'
                                            : selectedSlot.status === 'recurring_booked'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {selectedSlot.isPartialPayment && !selectedSlot.partialPaymentPaid
                                        ? 'Saldo pendiente'
                                        : getSlotLabel(selectedSlot)}
                                </span>
                            </div>

                            <div className="space-y-2.5 p-4 bg-slate-50 rounded-2xl">
                                {selectedSlot.customer_phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone size={15} className="text-slate-400 shrink-0" />
                                        <span className="font-semibold text-slate-700">{selectedSlot.customer_phone}</span>
                                    </div>
                                )}
                                {selectedSlot.booking_code && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Hash size={15} className="text-slate-400 shrink-0" />
                                        <span className="font-mono font-bold text-slate-700">{selectedSlot.booking_code}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-200/60">
                                    <span className="text-slate-500 font-semibold">Método de pago</span>
                                    <span className="font-bold text-slate-700 capitalize">
                                        {selectedSlot.payment_method === 'internal_block'
                                            ? 'Bloqueo'
                                            : selectedSlot.payment_method === 'internal_reservation'
                                                ? 'Interna'
                                                : selectedSlot.payment_method === 'presential'
                                                    ? 'Presencial'
                                                    : selectedSlot.payment_method || 'Online'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Banknote size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600">Total</span>
                                </div>
                                <span className="text-xl font-black text-slate-900">
                                    ${(selectedSlot.price || 0).toLocaleString('es-CL')}
                                </span>
                            </div>

                            {selectedSlot.isPartialPayment && (
                                <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-semibold">Abonado</span>
                                        <span className="font-bold text-emerald-600">${(selectedSlot.paidAmount || 0).toLocaleString('es-CL')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-semibold">Pendiente</span>
                                        <span className={`font-bold ${selectedSlot.partialPaymentPaid ? 'text-slate-400 line-through' : 'text-rose-600'}`}>
                                            ${(selectedSlot.pendingAmount || 0).toLocaleString('es-CL')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setSelectedSlot(null)}
                                className="flex-1 py-3.5 px-6 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                            >
                                Cerrar
                            </button>
                            {selectedSlot.isPartialPayment &&
                                (selectedSlot.partialPaymentPaid ? (
                                    <button
                                        onClick={() => handleUndoPayBalanceClick(selectedSlot)}
                                        disabled={!!isProcessing}
                                        className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-white bg-slate-700 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw size={16} />
                                        Deshacer Cobro
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handlePayBalanceClick(selectedSlot)}
                                        disabled={!!isProcessing}
                                        className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                    >
                                        <Banknote size={16} />
                                        Cobrar Saldo
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Pago */}
            <AlertDialog open={!!showConfirmPay} onOpenChange={(open) => !open && setShowConfirmPay(null)}>
                <AlertDialogContent className="rounded-[2rem] border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">Confirmar Pago Presencial</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base">
                            ¿Estás seguro de marcar el saldo pendiente de <span className="font-bold text-slate-900">${showConfirmPay?.pendingAmount?.toLocaleString('es-CL')}</span> como pagado en efectivo/presencial?
                            <br /><br />
                            Esta acción actualizará el estado de la reserva y registrará tu usuario como responsable.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-2">
                        <AlertDialogCancel className="rounded-2xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmPay}
                            disabled={!!isProcessing}
                            className="rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                        >
                            {isProcessing ? 'Confirmando...' : 'Confirmar Pago'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal Deshacer Pago */}
            <AlertDialog open={!!showConfirmUndo} onOpenChange={(open) => !open && setShowConfirmUndo(null)}>
                <AlertDialogContent className="rounded-[2rem] border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">Deshacer Cobro de Saldo</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base">
                            ¿Estás seguro de deshacer el cobro del saldo para esta reserva?
                            <br /><br />
                            El saldo volverá a figurar como pendiente y se registrará tu usuario como responsable de la modificación.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-2">
                        <AlertDialogCancel className="rounded-2xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmUndo}
                            disabled={!!isProcessing}
                            className="rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100"
                        >
                            {isProcessing ? 'Procesando...' : 'Deshacer Cobro'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};