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
import { useIsMobile } from '@/components/ui/use-mobile';
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
    Unlock,
    Trash2,
    Plus,
    Mail,
    MessageCircle,
} from 'lucide-react';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';
import { useAdminPanel } from '@/context/AdminPanelContext';
import { getTelUrl, getWhatsappUrl } from './recurring/recurringUtils';
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
import axios from 'axios';
import { AdminBookingModal } from './AdminBookingModal';
import { AdminAgendaMobileBar } from './AdminAgendaMobileBar';

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
    recurring_reservation_id?: string;
    is_recurring_weekly?: boolean;
    payment_method?: string;
    isPartialPayment?: boolean;
    partialPaymentPaid?: boolean;
    paidAmount?: number;
    pendingAmount?: number;
    duration_minutes?: number;
};

const formatCLP = (value?: number): string => `$${(value || 0).toLocaleString('es-CL')}`;

const getSlotDuration = (slot: SlotData): number =>
    slot.duration_minutes && slot.duration_minutes > 0 ? slot.duration_minutes : 60;

const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

const formatSlotTime = (slot: SlotData): string =>
    `${String(slot.hour).padStart(2, '0')}:${String(slot.minutes || 0).padStart(2, '0')}`;

const getPaymentMethodLabel = (slot: SlotData): string => {
    switch (slot.payment_method) {
        case 'internal_block':
            return 'Bloqueo';
        case 'internal_reservation':
            return 'Interna';
        case 'presential':
            return 'Presencial';
        case 'mercadopago':
            return 'Mercado Pago';
        default:
            return slot.payment_method || 'Online';
    }
};

type SlotDensity = 'tight' | 'normal' | 'full';

const getSlotDensity = (minutes: number): SlotDensity => {
    if (minutes <= 30) return 'tight';
    if (minutes >= 90) return 'full';
    return 'normal';
};

const getStatusBadge = (slot: SlotData): { text: string; tone: string } => {
    const hasPending = slot.isPartialPayment && !slot.partialPaymentPaid;
    if (hasPending) return { text: 'Saldo pendiente', tone: 'pending' };
    if (isInternalSlot(slot)) return { text: getSlotLabel(slot), tone: 'internal' };
    if (slot.status === 'recurring_booked') return { text: getSlotLabel(slot), tone: 'recurring' };
    if (slot.payment_method === 'internal_block' || slot.status === 'closed') {
        return { text: getSlotLabel(slot), tone: 'block' };
    }
    return { text: getSlotLabel(slot), tone: 'default' };
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
        deleteBooking,
        deleteSeries,
        cancelRecurringReservation,
        cancelRecurringDate,
        rescheduleBooking,
    } = useBookingStore();
    const { getAccessTokenSilently } = useAuth0();
    const { courts: contextCourts, currentSportCenter } = useAdminPanel();

    const calendarRef = useRef<any>(null);
    const fetchRef = useRef<string>('');
    const autoSelectedCourtRef = useRef(false);

    const isMobile = useIsMobile();

    const [viewType, setViewType] = useState<ViewType>('timeGridWeek');
    const [viewTitle, setViewTitle] = useState('');
    const [cursorDate, setCursorDate] = useState<Date>(startOfDay(new Date()));
    const [calendarReady, setCalendarReady] = useState(false);
    const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);
    const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

    const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
    const [showConfirmPay, setShowConfirmPay] = useState<SlotData | null>(null);
    const [showConfirmUndo, setShowConfirmUndo] = useState<SlotData | null>(null);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const [createTarget, setCreateTarget] = useState<{
        dateKey: string;
        hour: number;
        minutes: number;
    } | null>(null);
    const [unlockTarget, setUnlockTarget] = useState<{
        bookingId?: string;
        seriesId?: string;
        recurringId?: string;
        dateKey: string;
        customerName?: string;
        isBlock?: boolean;
    } | null>(null);
    const [moveTarget, setMoveTarget] = useState<{
        bookingId: string;
        title: string;
        courtName?: string;
        from: { dateKey: string; hour: number; minutes: number };
        to: { dateKey: string; hour: number; minutes: number };
        isSeries?: boolean;
    } | null>(null);
    const [isMutating, setIsMutating] = useState(false);
    const [hoveredEvent, setHoveredEvent] = useState<{
        slot: SlotData;
        courtName?: string;
        dateKey: string;
        rect: { top: number; left: number; width: number; height: number };
    } | null>(null);

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
        setCursorDate(arg.view.currentStart);
        setCalendarReady(true);
        setHoveredEvent(null);
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

    // En mobile la agenda trabaja siempre en vista día (una columna legible).
    // En desktop se vuelve a la vista semanal. El cambio se difiere para no
    // llamar a FullCalendar dentro del lifecycle de React (flushSync).
    useEffect(() => {
        if (!calendarReady) return;
        const api = calendarRef.current?.getApi();
        if (!api) return;
        const target = isMobile ? 'timeGridDay' : 'timeGridWeek';
        if (api.view?.type === target) return;
        const id = window.setTimeout(() => api.changeView(target), 0);
        return () => window.clearTimeout(id);
    }, [isMobile, calendarReady]);

    // En mobile los eventos de canchas distintas se partirían a la mitad:
    // arrancamos con la primera cancha seleccionada. Si el usuario elige
    // "Todas" no volvemos a forzarla.
    useEffect(() => {
        if (!isMobile || autoSelectedCourtRef.current) return;
        if (selectedCourtId || courts.length === 0) return;
        autoSelectedCourtRef.current = true;
        setSelectedCourtId(courts[0].id);
    }, [isMobile, courts, selectedCourtId]);

    const refreshRange = useCallback(async () => {
        if (!centerId || !visibleRange) return;
        const from = format(visibleRange.start, 'yyyy-MM-dd');
        const to = format(addDays(visibleRange.end, -1), 'yyyy-MM-dd');
        fetchRef.current = `${centerId}|${from}|${to}`;
        await fetchAdminSchedulesRange(centerId, from, to, getAccessTokenSilently);
    }, [centerId, visibleRange, fetchAdminSchedulesRange, getAccessTokenSilently]);

    const handleDateClick = useCallback((arg: any) => {
        const dateKey = format(arg.date, 'yyyy-MM-dd');
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        if (dateKey < todayKey) {
            toast.error('No puedes crear reservas en fechas pasadas');
            return;
        }
        setCreateTarget({
            dateKey,
            hour: arg.date.getHours(),
            minutes: arg.date.getMinutes(),
        });
    }, []);

    const canDragEvent = useCallback((event: any): boolean => {
        const p = event.extendedProps || {};
        const slot: SlotData = p.slot || {};
        if (!slot.booking_id) return false;
        if (p.isClosed) return false;
        if (slot.status === 'passed_booked') return false;
        // Las recurrentes semanales no son bookings: se gestionan desde el detalle.
        if (slot.is_recurring_weekly || slot.recurring_reservation_id) return false;
        // Solo reservas internas y bloqueos (pago en recinto).
        return isInternalSlot(slot);
    }, []);

    const eventAllow = useCallback(
        (dropInfo: any, draggedEvent: any) => {
            if (!draggedEvent || !canDragEvent(draggedEvent)) return false;
            const courtId = draggedEvent.extendedProps?.courtId;
            const target = dropInfo.start as Date;
            if (!target || !courtId) return false;

            const dateKey = format(target, 'yyyy-MM-dd');
            const hour = target.getHours();
            const minutes = target.getMinutes();
            const dayCourts = weeklySchedules?.[dateKey] || [];
            const court = (dayCourts as any[]).find((c: any) => String(c.id) === String(courtId));
            const exists = (court?.schedule || []).some(
                (s: any) => s.hour === hour && (s.minutes || 0) === minutes
            );
            if (!exists) return false;

            return true;
        },
        [canDragEvent, weeklySchedules]
    );

    const handleEventDrop = useCallback((info: any) => {
        const p = info.event.extendedProps || {};
        const slot: SlotData = p.slot || {};
        const oldStart: Date | null = info.oldEvent?.start || null;
        const newStart: Date | null = info.event.start || null;

        // Nunca se mueve nada sin confirmación: el evento vuelve a su lugar.
        info.revert();

        if (!slot.booking_id || !oldStart || !newStart) return;

        const from = {
            dateKey: format(oldStart, 'yyyy-MM-dd'),
            hour: oldStart.getHours(),
            minutes: oldStart.getMinutes(),
        };
        const to = {
            dateKey: format(newStart, 'yyyy-MM-dd'),
            hour: newStart.getHours(),
            minutes: newStart.getMinutes(),
        };
        if (
            from.dateKey === to.dateKey &&
            from.hour === to.hour &&
            from.minutes === to.minutes
        ) {
            return;
        }

        setMoveTarget({
            bookingId: String(slot.booking_id),
            title: info.event.title,
            courtName: p.courtName,
            from,
            to,
            isSeries: !!slot.series_id,
        });
    }, []);

    const handleConfirmMove = async () => {
        if (!moveTarget) return;
        setIsMutating(true);
        try {
            await rescheduleBooking(
                moveTarget.bookingId,
                {
                    date: moveTarget.to.dateKey,
                    hour: moveTarget.to.hour,
                    minutes: moveTarget.to.minutes,
                },
                getAccessTokenSilently
            );
            toast.success('Reserva movida con éxito');
            await refreshRange();
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.error || 'No se pudo mover la reserva'
                : 'No se pudo mover la reserva';
            toast.error(message);
        } finally {
            setIsMutating(false);
            setMoveTarget(null);
        }
    };

    const handleUnlockClick = (slot: SlotData, dateKey: string) => {
        setSelectedSlot(null);
        setUnlockTarget({
            bookingId: slot.booking_id,
            seriesId: slot.series_id,
            recurringId: slot.recurring_reservation_id,
            dateKey,
            customerName: slot.customer_name,
            isBlock: slot.payment_method === 'internal_block',
        });
    };

    const runUnlockAction = async (action: () => Promise<void>, successMessage: string) => {
        setIsMutating(true);
        try {
            await action();
            toast.success(successMessage);
            await refreshRange();
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.error || 'No se pudo completar la acción'
                : 'No se pudo completar la acción';
            toast.error(message);
        } finally {
            setIsMutating(false);
            setUnlockTarget(null);
        }
    };

    const handleUnlockSingle = () => {
        if (!unlockTarget?.bookingId) return;
        const bookingId = unlockTarget.bookingId;
        runUnlockAction(
            () => deleteBooking(bookingId, getAccessTokenSilently),
            unlockTarget.isBlock ? 'Horario desbloqueado con éxito' : 'Reserva eliminada con éxito'
        );
    };

    const handleUnlockSeries = () => {
        if (!unlockTarget?.seriesId) return;
        const seriesId = unlockTarget.seriesId;
        runUnlockAction(
            () => deleteSeries(seriesId, getAccessTokenSilently),
            'Serie de reservas eliminada'
        );
    };

    const handleCancelRecurring = () => {
        if (!unlockTarget?.recurringId) return;
        const recurringId = unlockTarget.recurringId;
        runUnlockAction(
            () => cancelRecurringReservation(recurringId, getAccessTokenSilently),
            'Reserva semanal cancelada'
        );
    };

    const handleCancelRecurringDate = () => {
        if (!unlockTarget?.recurringId) return;
        const recurringId = unlockTarget.recurringId;
        const dateKey = unlockTarget.dateKey;
        runUnlockAction(
            () => cancelRecurringDate(recurringId, dateKey, getAccessTokenSilently),
            'Fecha cancelada de la reserva semanal'
        );
    };

    const openCreateModal = () => {
        const now = new Date();
        const base = isMobile ? cursorDate : now;
        const isToday = format(base, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        setCreateTarget({
            dateKey: format(base, 'yyyy-MM-dd'),
            hour: isToday ? now.getHours() : 8,
            minutes: 0,
        });
    };

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
                    const durationMinutes = getSlotDuration(slot);
                    const end = new Date(new Date(start).getTime() + durationMinutes * 60 * 1000);

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
                            durationMinutes,
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

    // Franjas de 30 min que tienen una reserva o bloqueo. Las franjas sin nada
    // se pintan más bajas para compactar la agenda y destacar lo reservado.
    const occupiedSlotKeys = useMemo(() => {
        const keys = new Set<string>();
        const slotMs = 30 * 60 * 1000;
        events.forEach((ev) => {
            if (!ev.start) return;
            const start = new Date(ev.start).getTime();
            const end = ev.end ? new Date(ev.end).getTime() : start + 60 * 60 * 1000;
            for (let t = start; t < end; t += slotMs) {
                keys.add(format(new Date(t), 'HH:mm'));
            }
        });
        return keys;
    }, [events]);

    const isCompactSlot = useCallback(
        (arg: { date?: Date }) =>
            !!arg.date && !occupiedSlotKeys.has(format(arg.date, 'HH:mm')),
        [occupiedSlotKeys]
    );

    const slotLaneClassNames = useCallback(
        (arg: any) => (isCompactSlot(arg) ? 'rl-slot-compact' : ''),
        [isCompactSlot]
    );

    const calendarApi = () => calendarRef.current?.getApi();

    const goPrev = () => calendarApi()?.prev();
    const goNext = () => calendarApi()?.next();
    const goToday = () => calendarApi()?.today();
    const changeView = (v: ViewType) => calendarApi()?.changeView(v);
    const goToDate = (date: Date) => calendarApi()?.gotoDate(date);
    const selectCourt = (courtId: string | null) => {
        setSelectedCourtId(courtId);
        setHoveredEvent(null);
    };

    const handleEventClick = useCallback((info: any) => {
        setHoveredEvent(null);
        const p = info.event.extendedProps;
        if (!p.isBooked || !p.slot) return;
        const dateStr = format(info.event.start, 'yyyy-MM-dd');
        setSelectedSlot({ ...p.slot, __date: dateStr } as any);
    }, []);

    const handleEventMouseEnter = useCallback((info: any) => {
        // En touch el tooltip queda pegado y tapa el modal de detalle.
        if (isMobile) return;
        const p = info.event.extendedProps;
        if (!p?.slot || (!p.isBooked && !p.isClosed)) return;
        const el: HTMLElement | undefined = info.el;
        if (!el?.getBoundingClientRect) return;
        const rect = el.getBoundingClientRect();
        setHoveredEvent({
            slot: p.slot,
            courtName: p.courtName,
            dateKey: format(info.event.start, 'yyyy-MM-dd'),
            rect: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            },
        });
    }, [isMobile]);

    const handleEventMouseLeave = useCallback(() => {
        setHoveredEvent(null);
    }, []);

    useEffect(() => {
        if (!hoveredEvent) return;
        const close = () => setHoveredEvent(null);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [hoveredEvent]);

    const tooltipStyle = useMemo<React.CSSProperties | undefined>(() => {
        if (!hoveredEvent) return undefined;
        const width = 300;
        const margin = 12;
        const gap = 10;
        const { rect } = hoveredEvent;
        const spaceRight = window.innerWidth - (rect.left + rect.width + gap);
        let left = spaceRight >= width ? rect.left + rect.width + gap : rect.left - width - gap;
        left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
        const maxTop = window.innerHeight - 320;
        const top = Math.max(margin, Math.min(rect.top, maxTop));
        return { top, left, width };
    }, [hoveredEvent]);

    const renderEventContent = useCallback(
        (info: any) => {
            const p = info.event.extendedProps;
            const slot: SlotData = p.slot || {};
            const palette = COURT_PALETTE[courtColorIndex(p.courtId)];
            const isBlock = slot.payment_method === 'internal_block' || p.isClosed;
            const hasPending = slot.isPartialPayment && !slot.partialPaymentPaid;
            const isInternal = isInternalSlot(slot);
            const isMonth = String(info.view.type).startsWith('dayGrid');
            const duration = p.durationMinutes || getSlotDuration(slot);
            const density = getSlotDensity(duration);
            const badge = getStatusBadge(slot);

            const baseStyle: React.CSSProperties = {
                background: isBlock ? '#f1f5f9' : palette.soft,
                borderLeft: `3px solid ${isBlock ? '#94a3b8' : palette.solid}`,
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
                            {formatSlotTime(slot)}
                        </span>
                        <span className="font-semibold truncate flex-1">{info.event.title}</span>
                        {!isBlock && !!slot.price && (
                            <span className="rl-pill__price shrink-0">{formatCLP(slot.price)}</span>
                        )}
                        {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                    </div>
                );
            }

            return (
                <div
                    style={baseStyle}
                    className={`rl-pill rl-pill--time rl-pill--time--${density}`}
                >
                    <div className="rl-pill__head">
                        <span className="font-black" style={{ color: palette.solid }}>
                            {formatSlotTime(slot)}
                        </span>
                        <span className={`rl-badge rl-badge--${badge.tone}`}>
                            {badge.text}
                        </span>
                    </div>

                    <div className="rl-pill__name truncate">{info.event.title}</div>

                    <div className="rl-pill__meta">
                        <span className="rl-pill__court truncate">{p.courtName}</span>
                        {density !== 'tight' && !isBlock && !!slot.price && (
                            <span className="rl-pill__price shrink-0">
                                {formatCLP(slot.price)}
                                <span className="rl-pill__duration"> · {formatDuration(duration)}</span>
                            </span>
                        )}
                    </div>

                    {density !== 'tight' && !!slot.booking_code && (
                        <div className="rl-pill__code truncate">#{slot.booking_code}</div>
                    )}

                    {density === 'full' && (
                        <div className="rl-pill__extra">
                            {slot.customer_phone && <span className="truncate">{slot.customer_phone}</span>}
                            {slot.customer_phone && <span className="rl-pill__dot" />}
                            <span className="truncate">{getPaymentMethodLabel(slot)}</span>
                        </div>
                    )}

                    {density === 'full' && slot.isPartialPayment && (
                        <div className="rl-pill__extra rl-pill__extra--payment">
                            <span>Abonado {formatCLP(slot.paidAmount)}</span>
                            <span className={slot.partialPaymentPaid ? 'line-through text-slate-400' : 'text-rose-600'}>
                                {slot.partialPaymentPaid ? 'Pagado' : `Debe ${formatCLP(slot.pendingAmount)}`}
                            </span>
                        </div>
                    )}

                    {density === 'full' && isInternal && !slot.isPartialPayment && (
                        <div className="rl-pill__extra">
                            <span className="truncate">{getPaymentMethodLabel(slot)}</span>
                            {hasPending && <span className="text-rose-600 font-bold">Saldo pendiente</span>}
                        </div>
                    )}
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

    const contactMessage = selectedSlot
        ? `Hola${selectedSlot.customer_name ? ` ${selectedSlot.customer_name}` : ''}, te contactamos desde ${currentSportCenter?.name || 'tu centro deportivo'} por tu reserva del ${
              selectedSlotDate ? format(selectedSlotDate, "d 'de' MMMM", { locale: esFns }) : ''
          } a las ${formatSlotTime(selectedSlot)}.`.replace(/\s+/g, ' ').trim()
        : '';

    return (
        <div className="space-y-6 pb-24 md:pb-0">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 p-4 sm:p-8 shadow-xl shadow-emerald-600/10">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-emerald-300/20 blur-2xl" />
                <div className="relative flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6">
                    <div className="flex-1 min-w-0">
                        <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/15 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3">
                            <CalendarRange size={13} />
                            Agenda de Arriendos
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                            Gestiona tus arriendos
                        </h2>
                        <p className="text-sm sm:text-base text-emerald-100/90 mt-1">
                            Reservas, bloqueos y pagos pendientes en un solo calendario.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                        <div className="rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur px-2 py-2 sm:px-4 sm:py-3 flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                            <span className="hidden sm:flex w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
                                <CalendarDays size={18} className="text-white" />
                            </span>
                            <div className="text-center sm:text-left">
                                <p className="text-xl sm:text-2xl font-black text-white leading-none">{stats.booked}</p>
                                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-100/80 uppercase tracking-wider mt-1">Reservas</p>
                            </div>
                        </div>
                        <div className="rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur px-2 py-2 sm:px-4 sm:py-3 flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                            <span className="hidden sm:flex w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
                                <AlertCircle size={18} className="text-rose-200" />
                            </span>
                            <div className="text-center sm:text-left">
                                <p className="text-xl sm:text-2xl font-black text-white leading-none">{stats.pending}</p>
                                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-100/80 uppercase tracking-wider mt-1">Pendientes</p>
                            </div>
                        </div>
                        <div className="rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur px-2 py-2 sm:px-4 sm:py-3 flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                            <span className="hidden sm:flex w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
                                <Ban size={18} className="text-slate-200" />
                            </span>
                            <div className="text-center sm:text-left">
                                <p className="text-xl sm:text-2xl font-black text-white leading-none">{stats.blocked}</p>
                                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-100/80 uppercase tracking-wider mt-1">Bloqueos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra mobile: navegación día a día, tira semanal y filtro de canchas */}
            <AdminAgendaMobileBar
                cursorDate={cursorDate}
                courts={courts}
                selectedCourtId={selectedCourtId}
                colorFor={(courtId) => COURT_PALETTE[courtColorIndex(courtId)].solid}
                onPrev={goPrev}
                onNext={goNext}
                onToday={goToday}
                onSelectDate={goToDate}
                onSelectCourt={selectCourt}
                onNewBooking={openCreateModal}
            />

            {/* Toolbar (desktop) */}
            <div className="hidden md:flex bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 flex-wrap items-center gap-3">
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
                        {courts.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200"
                    >
                        <Plus size={16} />
                        Nueva reserva
                    </button>
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-x-4 gap-y-2 px-1 overflow-x-auto no-scrollbar flex-nowrap md:flex-wrap">
                <span className="shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Online
                </span>
                <span className="shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Interna
                </span>
                <span className="shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Recurrente
                </span>
                <span className="shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Bloqueo
                </span>
                <span className="shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-500 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Saldo pendiente
                </span>
            </div>

            <p className="hidden sm:block px-1 text-xs font-semibold text-slate-400">
                Haz clic en una hora libre para crear una reserva o un bloqueo. Arrastra un
                bloqueo o una reserva interna para moverla: siempre se pedirá confirmación.
            </p>

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
                        initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
                        locale={esLocale}
                        events={events}
                        eventContent={renderEventContent}
                        eventClick={handleEventClick}
                        eventMouseEnter={handleEventMouseEnter}
                        eventMouseLeave={handleEventMouseLeave}
                        dateClick={handleDateClick}
                        editable={!isMobile}
                        eventStartEditable={!isMobile}
                        eventDurationEditable={false}
                        slotEventOverlap={!isMobile}
                        dayHeaders={!isMobile}
                        eventAllow={eventAllow}
                        eventDrop={handleEventDrop}
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
                        slotLaneClassNames={slotLaneClassNames}
                        eventDisplay="block"
                        buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
                    />
                </div>
            </div>

            {/* Tooltip flotante con el detalle completo del slot */}
            {hoveredEvent && !isMobile && tooltipStyle && (() => {
                const slot = hoveredEvent.slot;
                const badge = getStatusBadge(slot);
                const isBlock = slot.payment_method === 'internal_block' || slot.status === 'closed';
                const displayName = isBlock
                    ? 'Bloqueo de horario'
                    : slot.customer_name || 'Reserva';
                return (
                    <div className="rl-event-tooltip" style={tooltipStyle}>
                        <div className="rl-event-tooltip__head">
                            <div className="min-w-0">
                                <p className="rl-event-tooltip__name truncate">{displayName}</p>
                                <p className="rl-event-tooltip__sub">
                                    {format(
                                        new Date(`${hoveredEvent.dateKey}T00:00:00`),
                                        "EEEE d 'de' MMMM",
                                        { locale: esFns }
                                    )}
                                    {' · '}
                                    {formatSlotTime(slot)}
                                    {' · '}
                                    {formatDuration(getSlotDuration(slot))}
                                </p>
                            </div>
                            <span className={`rl-badge rl-badge--${badge.tone}`}>{badge.text}</span>
                        </div>

                        <dl className="rl-event-tooltip__grid">
                            {hoveredEvent.courtName && (
                                <div>
                                    <dt>Cancha</dt>
                                    <dd>{hoveredEvent.courtName}</dd>
                                </div>
                            )}
                            {slot.booking_code && (
                                <div>
                                    <dt>Código</dt>
                                    <dd className="mono">{slot.booking_code}</dd>
                                </div>
                            )}
                            {slot.customer_phone && (
                                <div>
                                    <dt>Teléfono</dt>
                                    <dd>{slot.customer_phone}</dd>
                                </div>
                            )}
                            {slot.customer_email && (
                                <div>
                                    <dt>Email</dt>
                                    <dd className="truncate max-w-[170px]">{slot.customer_email}</dd>
                                </div>
                            )}
                            <div>
                                <dt>Pago</dt>
                                <dd>{getPaymentMethodLabel(slot)}</dd>
                            </div>
                            <div>
                                <dt>Total</dt>
                                <dd>{formatCLP(slot.price)}</dd>
                            </div>
                            {slot.isPartialPayment && (
                                <>
                                    <div>
                                        <dt>Abonado</dt>
                                        <dd className="text-emerald-600">{formatCLP(slot.paidAmount)}</dd>
                                    </div>
                                    <div>
                                        <dt>Pendiente</dt>
                                        <dd className={slot.partialPaymentPaid ? 'line-through text-slate-400' : 'text-rose-600'}>
                                            {slot.partialPaymentPaid ? 'Pagado' : formatCLP(slot.pendingAmount)}
                                        </dd>
                                    </div>
                                </>
                            )}
                            {(slot.is_recurring_weekly || slot.recurring_reservation_id) && (
                                <div>
                                    <dt>Recurrencia</dt>
                                    <dd className="text-amber-600">Semanal</dd>
                                </div>
                            )}
                            {slot.series_id && (
                                <div>
                                    <dt>Serie</dt>
                                    <dd>Reserva múltiple</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                );
            })()}

            {/* Modal detalle de reserva */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-6 max-w-md w-full max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-300 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6">
                        <span className="sm:hidden block mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
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
                                        {selectedSlotDate ? format(selectedSlotDate, "EEEE d 'de' MMMM", { locale: esFns }) : ''} · {formatSlotTime(selectedSlot)} · {formatDuration(getSlotDuration(selectedSlot))}
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
                                {selectedSlot.customer_email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail size={15} className="text-slate-400 shrink-0" />
                                        <span className="font-semibold text-slate-700 break-all">{selectedSlot.customer_email}</span>
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
                                        {getPaymentMethodLabel(selectedSlot)}
                                    </span>
                                </div>
                                {(selectedSlot.is_recurring_weekly || selectedSlot.recurring_reservation_id) && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-semibold">Recurrencia</span>
                                        <span className="font-bold text-amber-600">Semanal</span>
                                    </div>
                                )}
                                {selectedSlot.series_id && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-semibold">Serie</span>
                                        <span className="font-bold text-slate-700">Reserva múltiple</span>
                                    </div>
                                )}
                            </div>

                            {selectedSlot.customer_phone && getTelUrl(selectedSlot.customer_phone) && (
                                <div className="flex gap-3">
                                    <a
                                        href={getWhatsappUrl(selectedSlot.customer_phone, contactMessage)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200/60 transition-all hover:bg-[#20bd5a] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                                    >
                                        <MessageCircle size={17} />
                                        WhatsApp
                                    </a>
                                    <a
                                        href={getTelUrl(selectedSlot.customer_phone)}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200/60 transition-all hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                                    >
                                        <Phone size={16} />
                                        Llamar
                                    </a>
                                </div>
                            )}

                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Banknote size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600">Total</span>
                                </div>
                                <span className="text-xl font-black text-slate-900">
                                    {formatCLP(selectedSlot.price)}
                                </span>
                            </div>

                            {selectedSlot.isPartialPayment && (
                                <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-semibold">Abonado</span>
                                        <span className="font-bold text-emerald-600">{formatCLP(selectedSlot.paidAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-semibold">Pendiente</span>
                                        <span className={`font-bold ${selectedSlot.partialPaymentPaid ? 'text-slate-400 line-through' : 'text-rose-600'}`}>
                                            {formatCLP(selectedSlot.pendingAmount)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mt-6 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                            {(selectedSlot.booking_id ||
                                selectedSlot.recurring_reservation_id ||
                                selectedSlot.series_id) && (
                                <button
                                    onClick={() =>
                                        handleUnlockClick(
                                            selectedSlot,
                                            (selectedSlot as any).__date
                                        )
                                    }
                                    disabled={!!isProcessing || isMutating}
                                    className="w-full py-3 px-6 rounded-2xl font-bold border border-rose-100 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {selectedSlot.recurring_reservation_id ? (
                                        <Repeat size={16} />
                                    ) : selectedSlot.payment_method === 'internal_block' ? (
                                        <Unlock size={16} />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                    {selectedSlot.recurring_reservation_id
                                        ? 'Cancelar reserva semanal'
                                        : selectedSlot.payment_method === 'internal_block'
                                            ? 'Desbloquear horario'
                                            : 'Eliminar reserva'}
                                </button>
                            )}
                            <div className="flex gap-3">
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
                </div>
            )}

            {/* Modal Confirmar Pago */}
            <AlertDialog open={!!showConfirmPay} onOpenChange={(open) => !open && setShowConfirmPay(null)}>
                <AlertDialogContent className="z-[70] rounded-[2rem] border-slate-200">
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
                <AlertDialogContent className="z-[70] rounded-[2rem] border-slate-200">
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

            {/* Modal crear reserva / bloqueo */}
            {createTarget && (
                <AdminBookingModal
                    target={createTarget}
                    courts={courts}
                    initialCourtId={selectedCourtId}
                    centerId={centerId}
                    schedulesByDate={weeklySchedules}
                    onClose={() => setCreateTarget(null)}
                    onCreated={() => {
                        setCreateTarget(null);
                        refreshRange();
                    }}
                />
            )}

            {/* Confirmar mover reserva */}
            <AlertDialog
                open={!!moveTarget}
                onOpenChange={(open) => !open && !isMutating && setMoveTarget(null)}
            >
                <AlertDialogContent className="z-[70] rounded-[2rem] border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">
                            ¿Mover esta reserva?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base space-y-2">
                            <span className="block">
                                <span className="font-bold text-slate-900">
                                    {moveTarget?.title}
                                </span>
                                {moveTarget?.courtName ? ` · ${moveTarget.courtName}` : ''}
                            </span>
                            <span className="block">
                                Desde el{' '}
                                <span className="font-bold text-slate-900">
                                    {moveTarget
                                        ? format(
                                              new Date(
                                                  `${moveTarget.from.dateKey}T${String(
                                                      moveTarget.from.hour
                                                  ).padStart(2, '0')}:${String(
                                                      moveTarget.from.minutes
                                                  ).padStart(2, '0')}:00`
                                              ),
                                              "EEE d MMM HH:mm",
                                              { locale: esFns }
                                          )
                                        : ''}
                                </span>{' '}
                                hasta el{' '}
                                <span className="font-bold text-emerald-600">
                                    {moveTarget
                                        ? format(
                                              new Date(
                                                  `${moveTarget.to.dateKey}T${String(
                                                      moveTarget.to.hour
                                                  ).padStart(2, '0')}:${String(
                                                      moveTarget.to.minutes
                                                  ).padStart(2, '0')}:00`
                                              ),
                                              "EEE d MMM HH:mm",
                                              { locale: esFns }
                                          )
                                        : ''}
                                </span>
                            </span>
                            {moveTarget?.isSeries && (
                                <span className="block text-amber-600 font-semibold">
                                    Solo se moverá esta fecha; el resto de la serie no cambia.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-2">
                        <AlertDialogCancel
                            disabled={isMutating}
                            className="rounded-2xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                handleConfirmMove();
                            }}
                            disabled={isMutating}
                            className="rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                        >
                            {isMutating ? 'Moviendo...' : 'Mover reserva'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirmar desbloqueo / eliminación */}
            <AlertDialog
                open={!!unlockTarget}
                onOpenChange={(open) => !open && !isMutating && setUnlockTarget(null)}
            >
                <AlertDialogContent className="z-[70] rounded-[2rem] border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">
                            {unlockTarget?.recurringId
                                ? '¿Cancelar reserva semanal?'
                                : unlockTarget?.seriesId
                                    ? '¿Eliminar reserva de la serie?'
                                    : unlockTarget?.isBlock
                                        ? '¿Desbloquear horario?'
                                        : '¿Eliminar reserva?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base space-y-2">
                            <span className="block">
                                {unlockTarget?.customerName
                                    ? `Cliente: ${unlockTarget.customerName}. `
                                    : ''}
                                {unlockTarget?.recurringId
                                    ? 'Puedes cancelar solo esta fecha o finalizar la reserva semanal completa.'
                                    : unlockTarget?.seriesId
                                        ? 'Puedes eliminar solo esta fecha o toda la serie de reservas.'
                                        : unlockTarget?.isBlock
                                            ? 'El horario volverá a estar disponible para los clientes.'
                                            : 'La reserva se eliminará y el horario quedará disponible nuevamente.'}
                            </span>
                            {unlockTarget?.dateKey && (
                                <span className="block font-bold text-slate-900">
                                    {format(
                                        new Date(`${unlockTarget.dateKey}T12:00:00`),
                                        "EEEE d 'de' MMMM",
                                        { locale: esFns }
                                    )}
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-2">
                        <AlertDialogCancel
                            disabled={isMutating}
                            className="rounded-2xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600"
                        >
                            Cerrar
                        </AlertDialogCancel>

                        {unlockTarget?.recurringId ? (
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <button
                                    onClick={handleCancelRecurringDate}
                                    disabled={isMutating}
                                    className="flex-1 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 py-2 px-4 transition-all disabled:opacity-50"
                                >
                                    Solo esta fecha
                                </button>
                                <button
                                    onClick={handleCancelRecurring}
                                    disabled={isMutating}
                                    className="flex-1 rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 py-2 px-4 transition-all disabled:opacity-50"
                                >
                                    Toda la reserva
                                </button>
                            </div>
                        ) : unlockTarget?.seriesId ? (
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <button
                                    onClick={handleUnlockSingle}
                                    disabled={isMutating}
                                    className="flex-1 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 py-2 px-4 transition-all disabled:opacity-50"
                                >
                                    Solo esta fecha
                                </button>
                                <button
                                    onClick={handleUnlockSeries}
                                    disabled={isMutating}
                                    className="flex-1 rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 py-2 px-4 transition-all disabled:opacity-50"
                                >
                                    Toda la serie
                                </button>
                            </div>
                        ) : (
                            <AlertDialogAction
                                onClick={(event) => {
                                    event.preventDefault();
                                    handleUnlockSingle();
                                }}
                                disabled={isMutating || !unlockTarget?.bookingId}
                                className="rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200"
                            >
                                {isMutating
                                    ? 'Procesando...'
                                    : unlockTarget?.isBlock
                                        ? 'Desbloquear'
                                        : 'Eliminar reserva'}
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};