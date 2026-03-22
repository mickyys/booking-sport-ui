import React, { useState } from 'react';
import { Save, DollarSign } from 'lucide-react';

// Using any types to match original incomplete typing if needed
type PriceType = 'economic' | 'normal' | 'prime';

interface AdminSchedulesProps {
    courts: any[];
    schedules: any[];
    prices: any;
    onUpdatePrices: (prices: any) => void;
    onUpdateSchedule: (schedule: any) => void;
}

export const AdminSchedules: React.FC<AdminSchedulesProps> = ({
    courts,
    schedules,
    prices,
    onUpdatePrices,
    onUpdateSchedule
}) => {
    const [localPrices, setLocalPrices] = useState(prices);

    const handleToggleSlot = (courtId: string, hour: number) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const updatedSlots = schedule.slots.map((slot: any) =>
            slot.hour === hour ? { ...slot, enabled: !slot.enabled } : slot
        );

        onUpdateSchedule({ ...schedule, slots: updatedSlots });
    };

    const handleChangePriceType = (courtId: string, hour: number, priceType: PriceType) => {
        const schedule = schedules.find(s => s.courtId === courtId);
        if (!schedule) return;

        const updatedSlots = schedule.slots.map((slot: any) =>
            slot.hour === hour ? { ...slot, priceType } : slot
        );

        onUpdateSchedule({ ...schedule, slots: updatedSlots });
    };

    const handleSavePrices = () => {
        onUpdatePrices(localPrices);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-900">Configuración de Horarios y Tarifas</h3>
            </div>

            {/* Price Configuration */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <DollarSign size={20} />
                    </div>
                    <h4 className="font-bold text-lg text-slate-900">Definición de Tarifas</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">💰 Económico</label>
                        <input
                            type="number"
                            value={localPrices.economic}
                            onChange={e => setLocalPrices({...localPrices, economic: Number(e.target.value)})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Normal</label>
                        <input
                            type="number"
                            value={localPrices.normal}
                            onChange={e => setLocalPrices({...localPrices, normal: Number(e.target.value)})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">⭐ Prime</label>
                        <input
                            type="number"
                            value={localPrices.prime}
                            onChange={e => setLocalPrices({...localPrices, prime: Number(e.target.value)})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
                
                <button
                    onClick={handleSavePrices}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                    <Save size={18} />
                    Guardar Tarifas
                </button>
            </div>

            {/* Court Schedules */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h4 className="font-bold text-lg text-slate-900 mb-6">Horarios por Cancha</h4>

                <div className="space-y-10">
                    {courts.map(court => {
                        const schedule = schedules.find(s => s.courtId === court.id);
                        if (!schedule) return null;

                        return (
                            <div key={court.id} className="border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between mb-4">
                                    <h5 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                        <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                                        {court.name}
                                    </h5>
                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        {court.centerName}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {schedule.slots.map((slot: any) => (
                                        <div
                                            key={slot.hour}
                                            className={`relative flex flex-col gap-2 p-3 rounded-xl border-2 transition-all duration-300 ${slot.enabled
                                                ? 'border-emerald-100 bg-emerald-50/30'
                                                : 'border-slate-100 bg-slate-50 opacity-60'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`font-bold text-sm ${slot.enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                    {slot.hour}:00
                                                </span>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={slot.enabled}
                                                        onChange={() => handleToggleSlot(court.id, slot.hour)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </div>
                                            </div>
                                            <select
                                                value={slot.priceType || 'normal'}
                                                onChange={e => handleChangePriceType(court.id, slot.hour, e.target.value as PriceType)}
                                                disabled={!slot.enabled}
                                                className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
                                            >
                                                <option value="economic">💰 Económico</option>
                                                <option value="normal">Normal</option>
                                                <option value="prime">⭐ Prime</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
