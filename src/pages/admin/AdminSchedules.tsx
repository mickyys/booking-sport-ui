import React, { useState } from 'react';
import { Save, Plus, Trash2, Clock, AlertCircle, X, DollarSign, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface AdminSchedulesProps {
    courts: any[];
    schedules: any[];
    onUpdateSchedule: (schedule: any) => void;
}

export const AdminSchedules: React.FC<AdminSchedulesProps> = ({
    courts,
    schedules,
    onUpdateSchedule
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
    const [newSlot, setNewSlot] = useState({ time: '08:00', price: 0, paymentRequired: true });
    const [collapsedCourts, setCollapsedCourts] = useState<Record<string, boolean>>({});

    const toggleCollapse = (courtId: string) => {
        setCollapsedCourts(prev => ({ ...prev, [courtId]: !prev[courtId] }));
    };

    const toggleAll = (collapse: boolean) => {
        const newState = courts.reduce((acc, c) => ({ ...acc, [c.id]: collapse }), {});
        setCollapsedCourts(newState);
    };

    const handleToggleSlot = (courtId: string, hour: number, minutes: number) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const newSlots = schedule.slots.map((slot: any) =>
            (slot.hour === hour && (slot.minutes || 0) === minutes)
                ? { ...slot, enabled: !slot.enabled }
                : slot
        );

        onUpdateSchedule({ ...schedule, slots: newSlots });
    };

    const handleTogglePaymentRequired = (courtId: string, hour: number, minutes: number) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const newSlots = schedule.slots.map((slot: any) =>
            (slot.hour === hour && (slot.minutes || 0) === minutes)
                ? { ...slot, paymentRequired: !slot.paymentRequired }
                : slot
        );

        onUpdateSchedule({ ...schedule, slots: newSlots });
    };

    const handlePriceChange = (courtId: string, hour: number, minutes: number, price: number) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const newSlots = schedule.slots.map((slot: any) =>
            (slot.hour === hour && (slot.minutes || 0) === minutes)
                ? { ...slot, price }
                : slot
        );

        onUpdateSchedule({ ...schedule, slots: newSlots });
    };

    const handleTimeChange = (courtId: string, oldHour: number, oldMinutes: number, timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return;

        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const newSlots = schedule.slots.map((slot: any) =>
            (slot.hour === oldHour && (slot.minutes || 0) === oldMinutes)
                ? { ...slot, hour: h, minutes: m }
                : slot
        );

        // Check for duplicate time after change
        const times = newSlots.map((sl: any) => `${sl.hour}:${sl.minutes || 0}`);
        if (new Set(times).size !== times.length) {
            toast.error("Este horario ya existe en esta cancha");
            return;
        }

        onUpdateSchedule({ ...schedule, slots: newSlots });
    };

    const handleDeleteSlot = (courtId: string, hour: number, minutes: number) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const newSlots = schedule.slots.filter((slot: any) =>
            !(slot.hour === hour && (slot.minutes || 0) === minutes)
        );

        onUpdateSchedule({ ...schedule, slots: newSlots });
    };

    const openCreateModal = (courtId: string) => {
        setSelectedCourtId(courtId);
        setNewSlot({ time: '08:00', price: 0, paymentRequired: true });
        setIsModalOpen(true);
    };

    const handleCreateSlot = () => {
        if (!selectedCourtId) return;
        const schedule = schedules.find(s => s.courtId === selectedCourtId);
        if (!schedule) return;

        const [h, m] = newSlot.time.split(':').map(Number);

        // Already exists?
        if (schedule.slots.some((s: any) => s.hour === h && (s.minutes || 0) === m)) {
            toast.error("Este horario ya existe");
            return;
        }

        const newSlots = [...schedule.slots, { hour: h, minutes: m, price: newSlot.price, enabled: true, paymentRequired: newSlot.paymentRequired }]
            .sort((a, b) => (a.hour * 60 + (a.minutes || 0)) - (b.hour * 60 + (b.minutes || 0)));

        onUpdateSchedule({ ...schedule, slots: newSlots });
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Horarios</h3>
                    <p className="text-slate-500 text-sm mt-1">Sincronización instantánea con cada cambio.</p>
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
                {courts.map(court => {
                    const schedule = schedules.find(s => s.courtId === court.id);
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
                                            <span className="text-slate-300 text-xs font-medium">• {schedule.slots.length} horarios</span>
                                        </div>
                                    </div>
                                    {isCollapsed ? <ChevronDown className="text-slate-400 ml-auto" /> : <ChevronUp className="text-slate-400 ml-auto" />}
                                </div>
                                <button
                                    onClick={() => openCreateModal(court.id)}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 shrink-0"
                                >
                                    <Plus size={18} />
                                    Nuevo Horario
                                </button>
                            </div>

                            {/* Slots Grid */}
                            {!isCollapsed && (
                                <div className="p-6 lg:p-8 bg-white border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                                    {schedule.slots.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <AlertCircle size={40} className="mb-3 opacity-20" />
                                            <p className="font-medium">Sin horarios configurados</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {schedule.slots.map((slot: any, index: number) => (
                                                <div
                                                    key={`${index}-${slot.hour}-${slot.minutes}`}
                                                    className={`group/slot relative flex flex-col gap-5 p-6 rounded-[2rem] border-2 transition-all duration-300 ${slot.enabled
                                                        ? 'border-emerald-100 bg-white shadow-lg shadow-emerald-100/20'
                                                        : 'border-slate-100 bg-slate-50/50 opacity-70'
                                                        }`}
                                                >
                                                    {/* Delete Button - Top Right Absolute */}
                                                    <button
                                                        onClick={() => handleDeleteSlot(court.id, slot.hour, slot.minutes)}
                                                        className="absolute -top-2 -right-2 w-8 h-8 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full shadow-md border border-slate-100 flex items-center justify-center transition-all z-10"
                                                        title="Eliminar horario"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

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
                                                        <input
                                                            type="number"
                                                            value={slot.price}
                                                            onChange={e => handlePriceChange(court.id, slot.hour, slot.minutes || 0, Number(e.target.value))}
                                                            disabled={!slot.enabled}
                                                            placeholder="0"
                                                            className={`w-full text-base font-bold pl-8 pr-4 py-3 rounded-2xl border-2 transition-all outline-none ${slot.enabled
                                                                ? 'bg-emerald-50/50 border-emerald-100 focus:border-emerald-500 focus:bg-white text-emerald-900'
                                                                : 'bg-slate-100 border-slate-200 text-slate-400'
                                                                }`}
                                                        />
                                                    </div>

                                                    {/* Payment Required Toggle */}
                                                    <div className="flex items-center justify-between px-1">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Requiere Pago</label>
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
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Create Schedule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 italic underline decoration-emerald-500 decoration-4 underline-offset-4">Nuevo Horario</h4>
                                <p className="text-slate-500 text-sm mt-2">Configura la hora y el valor de la sesión</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 italic">Hora de inicio</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                        <Clock size={20} />
                                    </div>
                                    <input
                                        type="time"
                                        value={newSlot.time}
                                        onChange={e => setNewSlot({ ...newSlot, time: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 pl-12 pr-6 text-xl font-black focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1 italic">Valor de la reserva</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xl">
                                        $
                                    </div>
                                    <input
                                        type="number"
                                        value={newSlot.price}
                                        onChange={e => setNewSlot({ ...newSlot, price: Number(e.target.value) })}
                                        placeholder="Ingrese el valor"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 pl-12 pr-6 text-xl font-black focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 italic">Requiere Pago previo</label>
                                    <p className="text-xs text-slate-500">Muestra la pasarela de pago al reservar</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newSlot.paymentRequired}
                                        onChange={e => setNewSlot({ ...newSlot, paymentRequired: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            <button
                                onClick={handleCreateSlot}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg py-4 rounded-3xl shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95 group"
                            >
                                <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                                Crear Horario
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
