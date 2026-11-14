"use client";
import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { es as esFns } from 'date-fns/locale';

interface CourtOption {
    id: string;
    name: string;
}

interface AdminAgendaMobileBarProps {
    cursorDate: Date;
    courts: CourtOption[];
    selectedCourtId: string | null;
    colorFor: (courtId: string) => string;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    onSelectDate: (date: Date) => void;
    onSelectCourt: (courtId: string | null) => void;
    onNewBooking: () => void;
}

export const AdminAgendaMobileBar: React.FC<AdminAgendaMobileBarProps> = ({
    cursorDate,
    courts,
    selectedCourtId,
    colorFor,
    onPrev,
    onNext,
    onToday,
    onSelectDate,
    onSelectCourt,
    onNewBooking,
}) => {
    const days = React.useMemo(() => {
        const start = startOfWeek(cursorDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, index) => addDays(start, index));
    }, [cursorDate]);

    const today = React.useMemo(() => new Date(), []);

    const dateLabel = React.useMemo(() => {
        const label = format(cursorDate, "EEE d 'de' MMM", { locale: esFns });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }, [cursorDate]);

    return (
        <>
            {/* Navegación fija: día anterior/siguiente + tira semanal */}
            <div
                data-testid="agenda-mobile-bar"
                className="md:hidden sticky top-16 z-30 -mx-4 bg-slate-50/95 backdrop-blur border-b border-slate-100 px-4 pt-2.5 pb-2 space-y-2"
            >
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrev}
                        aria-label="Día anterior"
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 active:scale-95 transition"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex-1 min-w-0 text-center">
                        <p className="text-sm font-black text-slate-900 leading-tight truncate">
                            {dateLabel}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {format(cursorDate, 'yyyy')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onToday}
                        className="px-3 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold active:scale-95 transition"
                    >
                        Hoy
                    </button>

                    <button
                        type="button"
                        onClick={onNext}
                        aria-label="Día siguiente"
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 active:scale-95 transition"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map((day) => {
                        const isActive = isSameDay(day, cursorDate);
                        const isToday = isSameDay(day, today);
                        return (
                            <button
                                key={day.toISOString()}
                                type="button"
                                onClick={() => onSelectDate(day)}
                                aria-label={format(day, "EEEE d 'de' MMMM", { locale: esFns })}
                                aria-current={isActive ? 'date' : undefined}
                                className={`h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition ${
                                    isActive
                                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                        : isToday
                                            ? 'bg-white text-emerald-700 border border-emerald-200'
                                            : 'bg-white text-slate-600 border border-slate-100'
                                }`}
                            >
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                                    {format(day, 'EEEEEE', { locale: esFns })}
                                </span>
                                <span className="text-sm font-black leading-none">
                                    {format(day, 'd')}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filtros y acción principal: scrollean con el contenido */}
            <div className="md:hidden -mx-4 px-4 pt-2.5 pb-1 space-y-2.5">
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
                    <button
                        type="button"
                        onClick={() => onSelectCourt(null)}
                        className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                            selectedCourtId === null
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200'
                        }`}
                    >
                        Todas
                    </button>
                    {courts.map((court) => {
                        const isActive = selectedCourtId === court.id;
                        return (
                            <button
                                key={court.id}
                                type="button"
                                onClick={() => onSelectCourt(court.id)}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                                    isActive
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200'
                                }`}
                            >
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: colorFor(court.id) }}
                                />
                                <span className="max-w-[140px] truncate">{court.name}</span>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={onNewBooking}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold active:scale-[0.99] transition shadow-sm shadow-emerald-200"
                >
                    <Plus size={16} />
                    Nueva reserva
                </button>
            </div>
        </>
    );
};
