"use client";
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Clock, AlertCircle, X, DollarSign, ChevronDown, ChevronUp, Layers, Calendar } from 'lucide-react';
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

const PriceInput: React.FC<{
    value: number;
    onChange: (val: number) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    debounceMs?: number;
}> = ({ value, onChange, disabled, className, placeholder, debounceMs = 500 }) => {
    const [localValue, setLocalValue] = useState<string>(value === 0 ? '' : value.toString());
    const [isFocused, setIsFocused] = useState(false);
    const timeoutRef = useRef<any>(null);

    useEffect(() => {
        // Only sync with prop if NOT focused to avoid flickering during typing
        if (!isFocused) {
            const numericLocal = localValue === '' ? 0 : parseInt(localValue, 10);
            if (value !== numericLocal) {
                setLocalValue(value === 0 ? '' : value.toString());
            }
        }
    }, [value, isFocused]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Only allow integers
        if (val !== '' && !/^\d+$/.test(val)) return;

        setLocalValue(val);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (debounceMs === 0) {
            onChange(val === '' ? 0 : parseInt(val, 10));
        } else {
            timeoutRef.current = setTimeout(() => {
                onChange(val === '' ? 0 : parseInt(val, 10));
            }, debounceMs);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        // On blur, ensure the latest value is sent immediately if there's a pending change
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            const numericLocal = localValue === '' ? 0 : parseInt(localValue, 10);
            if (numericLocal !== value) {
                onChange(numericLocal);
            }
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            value={localValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={className}
        />
    );
};

interface AdminSchedulesProps {
    courts: any[];
    schedules: any[];
    onUpdateSchedule: (schedule: any) => Promise<void>;
    onUpdateScheduleSlot: (courtId: string, slot: any) => Promise<void>;
    centerDefaultSchedule?: { start_time: string; end_time: string };
    centerScheduleOverrides?: Record<number, { start_time: string; end_time: string }>;
    centerActiveDays?: number[];
}

export const AdminSchedules: React.FC<AdminSchedulesProps> = ({
    courts,
    schedules,
    onUpdateSchedule,
    onUpdateScheduleSlot,
    centerDefaultSchedule = { start_time: '19:00', end_time: '20:00' },
    centerScheduleOverrides = {},
    centerActiveDays = [1, 2, 3, 4, 5, 6]
}) => {
    const daysOfWeek = [
        { label: 'Domingo', value: 0 },
        { label: 'Lunes', value: 1 },
        { label: 'Martes', value: 2 },
        { label: 'Miércoles', value: 3 },
        { label: 'Jueves', value: 4 },
        { label: 'Viernes', value: 5 },
        { label: 'Sábado', value: 6 },
    ];

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState<{ courtId: string, hour: number, minutes: number } | null>(null);

    const [loadingSlots, setLoadingSlots] = useState<Record<string, boolean>>({});
    const [collapsedCourts, setCollapsedCourts] = useState<Record<string, boolean>>({});
    const [collapsedDays, setCollapsedDays] = useState<Record<string, Record<string, boolean>>>({});

    const [courtDaySettings, setCourtDaySettings] = useState<Record<string, { dayOfWeek: number | null; startTime: string; endTime: string; price: number }>>({});
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [selectedCourtForGen, setSelectedCourtForGen] = useState<string | null>(null);
    const [generatePrice, setGeneratePrice] = useState(0);

    const toggleCollapse = (courtId: string) => {
        setCollapsedCourts(prev => ({ ...prev, [courtId]: !prev[courtId] }));
    };

    const toggleDayCollapse = (courtId: string, dayKey: string) => {
        setCollapsedDays(prev => ({
            ...prev,
            [courtId]: {
                ...(prev[courtId] || {}),
                [dayKey]: !(prev[courtId]?.[dayKey])
            }
        }));
    };

    const toggleAll = (collapse: boolean) => {
        const newState = courts.reduce((acc, c) => ({ ...acc, [c.id]: collapse }), {});
        setCollapsedCourts(newState);
    };

    const handleToggleSlot = (courtId: string, hour: number, minutes: number) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const slot = schedule.slots.find((s: any) => s.hour === hour && (s.minutes || 0) === minutes);
        if (!slot) return;

        onUpdateScheduleSlot(courtId, { ...slot, enabled: !slot.enabled });
    };

    const handleTogglePaymentRequired = (courtId: string, hour: number, minutes: number) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const slot = schedule.slots.find((s: any) => s.hour === hour && (s.minutes || 0) === minutes);
        if (!slot) return;

        onUpdateScheduleSlot(courtId, { 
            ...slot, 
            paymentRequired: !slot.paymentRequired, 
            paymentOptional: !slot.paymentRequired ? false : slot.paymentOptional 
        });
    };

    const handleTogglePaymentOptional = async (courtId: string, hour: number, minutes: number) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const slot = schedule.slots.find((s: any) => s.hour === hour && (s.minutes || 0) === minutes);
        if (!slot) return;

        const key = `${courtId}-${hour}-${minutes || 0}`;
        setLoadingSlots(prev => ({ ...prev, [key]: true }));

        try {
            await onUpdateScheduleSlot(courtId, { 
                ...slot, 
                paymentOptional: !slot.paymentOptional,  
                paymentRequired: !slot.paymentOptional ? false : slot.paymentRequired 
            });
        } catch (err) {
            // Error handling is in AdminPage
        } finally {
            setLoadingSlots(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleTogglePartialPayment = async (courtId: string, hour: number, minutes: number) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const slot = schedule.slots.find((s: any) => s.hour === hour && (s.minutes || 0) === minutes);
        if (!slot) return;

        // Toggle between true and false
        const nextValue = slot.partialPaymentEnabled === true ? false : true;

        const key = `${courtId}-${hour}-${minutes || 0}`;
        setLoadingSlots(prev => ({ ...prev, [key]: true }));

        try {
            await onUpdateScheduleSlot(courtId, { ...slot, partialPaymentEnabled: nextValue });
        } catch (err) {
            // Error handling
        } finally {
            setLoadingSlots(prev => ({ ...prev, [key]: false }));
        }
    };


    const handlePriceChange = (courtId: string, hour: number, minutes: number, price: number) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const slot = schedule.slots.find((s: any) => s.hour === hour && (s.minutes || 0) === minutes);
        if (!slot) return;

        onUpdateScheduleSlot(courtId, { ...slot, price });
    };

    const handleTimeChange = (courtId: string, oldHour: number, oldMinutes: number, timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return;

        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const slot = schedule.slots.find((s: any) => s.hour === oldHour && (s.minutes || 0) === oldMinutes);
        if (!slot) return;

        // Check for duplicate time after change
        if (schedule.slots.some((sl: any) => sl.hour === h && (sl.minutes || 0) === m && sl !== slot)) {
            toast.error("Este horario ya existe en esta cancha");
            return;
        }

        setSlotToDelete({ courtId, hour: oldHour, minutes: oldMinutes });
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSlot = (courtId: string, hour: number, minutes: number) => {
        setSlotToDelete({ courtId, hour, minutes });
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteSlot = () => {
        if (!slotToDelete) return;
        const { courtId, hour, minutes } = slotToDelete;

        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const newSlots = schedule.slots.filter((slot: any) =>
            !(slot.hour === hour && (slot.minutes || 0) === minutes)
        );

        onUpdateSchedule({ ...schedule, slots: newSlots });
        setDeleteConfirmOpen(false);
        setSlotToDelete(null);
    };

    const generateSlotsForDay = () => {
        if (!selectedCourtForGen) return;
        
        const settings = courtDaySettings[selectedCourtForGen];
        if (!settings) return;

        const schedule = schedules.find(s => s.courtId === selectedCourtForGen);
        if (!schedule) return;

        const [startH, startM] = settings.startTime.split(':').map(Number);
        const [endH, endM] = settings.endTime.split(':').map(Number);
        
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        
        const newSlots: any[] = [];
        
        // Generar slots con intervalos de 1 hora desde la hora de inicio
        // Incluye el último slot si hay exactamente espacio para uno completo
        let currentMin = startMinutes;
        while (currentMin < endMinutes) {
            const hour = Math.floor(currentMin / 60);
            const minutes = currentMin % 60;
            
            // Solo agregar si no existe ya este horario
            if (!schedule.slots.some((s: any) => s.hour === hour && (s.minutes || 0) === minutes)) {
                newSlots.push({
                    hour,
                    minutes,
                    price: settings.price || 0,
                    enabled: true,
                    paymentRequired: true,
                    paymentOptional: false,
                    dayOfWeek: settings.dayOfWeek
                });
            }
            
            // Avanzar 1 hora (60 minutos)
            currentMin += 60;
        }

        // Also add the end time slot if it's not already there and is different from start
        if (endMinutes > startMinutes && !schedule.slots.some((s: any) => s.hour === endH && (s.minutes || 0) === endM)) {
            newSlots.push({
                hour: endH,
                minutes: endM,
                price: settings.price || 0,
                enabled: true,
                paymentRequired: true,
                paymentOptional: false,
                dayOfWeek: settings.dayOfWeek
            });
        }

        if (newSlots.length === 0) {
            toast.error("Los horarios ya existen para este día");
            return;
        }

        const updatedSlots = [...schedule.slots, ...newSlots].sort((a, b) => (a.hour * 60 + (a.minutes || 0)) - (b.hour * 60 + (b.minutes || 0)));
        
        onUpdateSchedule({ ...schedule, slots: updatedSlots });
        setShowGenerateModal(false);
        setSelectedCourtForGen(null);
        toast.success(`${newSlots.length} horarios generados para ${settings.dayOfWeek === null ? 'Horario General' : daysOfWeek.find(d => d.value === settings.dayOfWeek)?.label}`);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Tarifas por Cancha</h3>
                    <p className="text-slate-500 text-sm mt-1">Configura el precio y opciones de pago para cada horario de tus canchas.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                        onClick={() => toggleAll(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-white transition-all"
                    >
                        Contraer Todo
                    </button>
                    <button
                        onClick={() => toggleAll(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-white transition-all shadow-sm"
                    >
                        Expandir Todo
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {(courts || []).map(court => {
                    const schedule = (schedules || []).find(s => s.courtId === court.id);
                    if (!schedule) return null;
                    const isCollapsed = collapsedCourts[court.id];

                    return (
                        <div key={court.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden group/card transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-100/50">
                            {/* Header Section */}
                            <div className="bg-slate-50/50 p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                                <div
                                    className="flex items-center gap-4 cursor-pointer flex-1"
                                    onClick={() => toggleCollapse(court.id)}
                                >
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center text-white ring-4 ring-emerald-50 shrink-0">
                                        {isCollapsed ? <Layers size={22} /> : <Clock size={24} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h5 className="font-black text-2xl text-slate-900 tracking-tight truncate">
                                            {court.name}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">Activa</span>
                                            <span className="text-slate-400 text-xs font-medium truncate">• {court.centerName}</span>
                                            <span className="text-slate-300 text-xs font-medium">• {(schedule.slots || []).length} horarios</span>
                                        </div>
                                    </div>
                                    {isCollapsed ? <ChevronDown className="text-slate-400 ml-auto" /> : <ChevronUp className="text-slate-400 ml-auto" />}
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedCourtForGen(court.id);
                                        setCourtDaySettings(prev => ({ 
                                            ...prev, 
                                            [court.id]: { 
                                                dayOfWeek: 1, 
                                                startTime: centerDefaultSchedule.start_time, 
                                                endTime: centerDefaultSchedule.end_time,
                                                price: 0
                                            } 
                                        }));
                                        setShowGenerateModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 shrink-0"
                                >
                                    <Calendar size={18} />
                                    Generar
                                </button>
                            </div>

                            {/* Slots Grid */}
                            {!isCollapsed && (
                                <div className="p-6 lg:p-8 bg-white border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                                    {(!schedule.slots || schedule.slots.length === 0) ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <AlertCircle size={40} className="mb-3 opacity-20" />
                                            <p className="font-medium">Sin horarios configurados</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-12">
                                            {(() => {
                                                const grouped = (schedule.slots || []).reduce((acc: any, slot: any) => {
                                                    const day = slot.dayOfWeek === undefined || slot.dayOfWeek === null ? 'null' : slot.dayOfWeek.toString();
                                                    if (!acc[day]) acc[day] = [];
                                                    acc[day].push(slot);
                                                    return acc;
                                                }, {});

                                                const sortedDays = Object.keys(grouped).sort((a, b) => {
                                                    const da = a === 'null' ? -1 : (parseInt(a) === 0 ? 7 : parseInt(a));
                                                    const db = b === 'null' ? -1 : (parseInt(b) === 0 ? 7 : parseInt(b));
                                                    return da - db;
                                                });

                                                return sortedDays.map(dayKey => {
                                                    const day = dayKey === 'null' ? null : parseInt(dayKey);
                                                    const daySlots = grouped[dayKey].sort((a: any, b: any) => (a.hour * 60 + (a.minutes || 0)) - (b.hour * 60 + (b.minutes || 0)));
                                                    const isDayCollapsed = collapsedDays[court.id]?.[dayKey];
                                                    
                                                    // Obtener solo los horarios habilitados para el resumen
                                                    const enabledSlotsSummary = daySlots
                                                        .filter((s: any) => s.enabled)
                                                        .map((s: any) => `${String(s.hour).padStart(2, '0')}:${String(s.minutes || 0).padStart(2, '0')}`)
                                                        .join(', ');

                                                    return (
                                                        <div key={dayKey} className="space-y-4">
                                                            <div 
                                                                className="flex items-center gap-3 cursor-pointer group/day"
                                                                onClick={() => toggleDayCollapse(court.id, dayKey)}
                                                            >
                                                                <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${day === null ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white shadow-md shadow-blue-100'} ${isDayCollapsed ? 'opacity-90 hover:opacity-100' : ''}`}>
                                                                    {day === null ? 'Horario General' : daysOfWeek.find(d => d.value === day)?.label}
                                                                    {isDayCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                                                </div>
                                                                <div className="h-px bg-slate-100 flex-1" />
                                                            </div>
                                                            
                                                            {isDayCollapsed && (
                                                                <div className="px-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                    {enabledSlotsSummary ? (
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {enabledSlotsSummary.split(', ').map((hour: string, i: number) => (
                                                                                <span key={i} className="px-3 py-1 bg-slate-50 text-slate-700 text-sm font-bold rounded-xl border border-slate-100">
                                                                                    {hour}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm font-bold text-slate-400 italic">No hay horarios habilitados</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {!isDayCollapsed && (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                                    {daySlots.map((slot: any, index: number) => {
                                                                        const slotKey = `${court.id}-${slot.hour}-${slot.minutes || 0}`;
                                                                        const isLoading = !!loadingSlots[slotKey];

                                                                        return (
                                                                            <div
                                                                                key={`${dayKey}-${index}-${slot.hour}-${slot.minutes}`}
                                                                                className={`group/slot relative flex flex-col gap-5 p-6 rounded-[2rem] border-2 transition-all duration-300 ${slot.enabled
                                                                                    ? 'border-emerald-100 bg-white shadow-lg shadow-emerald-100/20'
                                                                                    : 'border-slate-100 bg-slate-50/50 opacity-70'
                                                                                    }`}
                                                                            >                                                    {/* Delete Button - Top Right Absolute */}
                                                    <button
                                                        onClick={() => handleDeleteSlot(court.id, slot.hour, slot.minutes)}
                                                        className="absolute -top-2 -right-2 w-8 h-8 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full shadow-md border border-slate-100 flex items-center justify-center transition-all z-10"
                                                        title="Eliminar horario"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

                                                    {/* Day of Week Badge */}
                                                    {slot.dayOfWeek !== undefined && slot.dayOfWeek !== null && (
                                                        <div className="absolute -top-2 -left-2 px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full shadow-md">
                                                            {daysOfWeek.find(d => d.value === slot.dayOfWeek)?.label}
                                                        </div>
                                                    )}

                                                    {/* Slot Header: Time and Toggle */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <div className={`p-2 rounded-xl shrink-0 ${slot.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                                                <Clock size={16} />
                                                            </div>
                                                            <input
                                                                type="time"
                                                                value={`${String(slot.hour).padStart(2, '0')}:${String(slot.minutes || 0).padStart(2, '0')}`}
                                                                onChange={e => handleTimeChange(court.id, slot.hour, slot.minutes || 0, e.target.value)}
                                                                className={`w-full text-xl font-black bg-transparent border-none p-0 focus:ring-0 ${slot.enabled ? 'text-slate-900 font-black' : 'text-slate-500'}`}
                                                            />
                                                        </div>

                                                        <div className="flex items-center shrink-0 ml-auto">
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={slot.enabled}
                                                                    onChange={() => handleToggleSlot(court.id, slot.hour, slot.minutes || 0)}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Price Input */}
                                                    <div className="relative group/input">
                                                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold transition-colors ${slot.enabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                            $
                                                        </div>
                                                        <PriceInput
                                                            value={slot.price}
                                                            onChange={val => handlePriceChange(court.id, slot.hour, slot.minutes || 0, val)}
                                                            disabled={!slot.enabled}
                                                            placeholder="Ingrese valor"
                                                            className={`w-full text-base font-bold pl-8 pr-4 py-3 rounded-2xl border-2 transition-all outline-none ${slot.enabled
                                                                ? 'bg-emerald-50/50 border-emerald-100 focus:border-emerald-500 focus:bg-white text-emerald-900'
                                                                : 'bg-slate-100 border-slate-200 text-slate-400'
                                                                }`}
                                                        />
                                                    </div>

                                                    {/* Payment Required Toggle */}
                                                    <div className="flex items-center justify-between px-1">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Pago Requerido</label>
                                                        <label className="relative inline-flex items-center cursor-pointer scale-90">
                                                            <input
                                                                type="checkbox"
                                                                checked={slot.paymentRequired}
                                                                onChange={() => handleTogglePaymentRequired(court.id, slot.hour, slot.minutes || 0)}
                                                                className="sr-only peer"
                                                                disabled={!slot.enabled}
                                                            />
                                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                                        </label>
                                                    </div>

                                                    {/* Partial Payment Toggle */}
                                                    <div className="flex items-center justify-between px-1">
                                                        <div className="flex flex-col">
                                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Abonos</label>
<span className="text-[10px] text-slate-400 -mt-1">
                                                                {slot.partialPaymentEnabled === true ? 'Activado' : 'Desactivado'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTogglePartialPayment(court.id, slot.hour, slot.minutes || 0)}
                                                            disabled={!slot.enabled}
                                                            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none scale-90 ${
                                                                slot.partialPaymentEnabled === true ? 'bg-blue-500' : 'bg-slate-300'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                                    slot.partialPaymentEnabled === true ? 'translate-x-6' : 'translate-x-1'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>

                                                    {/* Payment Optional Toggle */}
                                                    <div className="flex items-center justify-between px-1">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Pago Opcional</label>
                                                        <label className="relative inline-flex items-center cursor-pointer scale-90">
                                                            <input
                                                                type="checkbox"
                                                                checked={slot.paymentOptional}
                                                                onChange={() => handleTogglePaymentOptional(court.id, slot.hour, slot.minutes || 0)}
                                                                className="sr-only peer"
                                                                disabled={!slot.enabled || isLoading}
                                                            />
                                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                                        </label>
                                                        {isLoading && (
                                                            <div className="ml-3 w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                            })}
                                            </div>
                                            )}
                                            </div>
                                            );
                                            });                    })()}
                </div>
            )}                                    
        </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Generate Slots Modal */}
            {showGenerateModal && selectedCourtForGen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowGenerateModal(false)}></div>
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 italic underline decoration-blue-500 decoration-4 underline-offset-4">Generar Horarios</h4>
                                <p className="text-slate-500 text-sm mt-2">Crea múltiples horarios automáticamente</p>
                            </div>
                            <button
                                onClick={() => setShowGenerateModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 italic">Día de la semana</label>
                                <select
                                    value={courtDaySettings[selectedCourtForGen]?.dayOfWeek ?? 'null'}
                                    onChange={e => setCourtDaySettings(prev => ({
                                        ...prev,
                                        [selectedCourtForGen]: { ...prev[selectedCourtForGen], dayOfWeek: e.target.value === 'null' ? null : parseInt(e.target.value) }
                                    }))}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 px-6 text-xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all shadow-sm"
                                >
                                    <option value="null">Horario General (Toda la semana)</option>
                                    {daysOfWeek.map(day => (
                                        <option key={day.value} value={day.value}>{day.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 italic">Inicio</label>
                                    <input
                                        type="time"
                                        value={courtDaySettings[selectedCourtForGen]?.startTime ?? '09:00'}
                                        onChange={e => setCourtDaySettings(prev => ({
                                            ...prev,
                                            [selectedCourtForGen]: { ...prev[selectedCourtForGen], startTime: e.target.value }
                                        }))}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 px-6 text-xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 italic">Fin</label>
                                    <input
                                        type="time"
                                        value={courtDaySettings[selectedCourtForGen]?.endTime ?? '22:00'}
                                        onChange={e => setCourtDaySettings(prev => ({
                                            ...prev,
                                            [selectedCourtForGen]: { ...prev[selectedCourtForGen], endTime: e.target.value }
                                        }))}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 px-6 text-xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 italic">Valor de la reserva</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-black text-xl">
                                        $
                                    </div>
                                    <input
                                        type="number"
                                        value={courtDaySettings[selectedCourtForGen]?.price ?? 0}
                                        onChange={e => setCourtDaySettings(prev => ({
                                            ...prev,
                                            [selectedCourtForGen]: { ...prev[selectedCourtForGen], price: parseInt(e.target.value) || 0 }
                                        }))}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 pl-12 pr-6 text-xl font-black focus:border-blue-500 focus:bg-white outline-none transition-all shadow-sm"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                                Se generarán horarios cada hora desde el inicio hasta el fin (sin incluir el último).
                            </p>

                            <button
                                onClick={generateSlotsForDay}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-4 rounded-3xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95 group"
                            >
                                <Calendar size={22} className="group-hover:scale-110 transition-transform" />
                                Generar Horarios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent className="rounded-[2rem] border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900">¿Eliminar horario?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base">
                            Esta acción no se puede deshacer. El horario se eliminará permanentemente de la cancha.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="rounded-2xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteSlot}
                            className="rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200"
                        >
                            Eliminar Horario
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
