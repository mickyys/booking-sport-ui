import React from 'react';
import { Ban } from 'lucide-react';
import { format } from 'date-fns';
import { TimeSlot } from '../../types';

interface AdminCalendarProps {
    slots: TimeSlot[];
    courts: any[];
    onBlockSlot: (slot: TimeSlot) => void;
}

export const AdminCalendar: React.FC<AdminCalendarProps> = ({ 
    slots, 
    courts, 
    onBlockSlot 
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.slice(0, 30).map(slot => (
                <div key={slot.id} className={`p-4 rounded-xl border ${slot.status === 'available' ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-900">{format(slot.date, "d MMM, HH:mm")}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${slot.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                            {slot.status}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{courts.find(c => c.id === slot.courtId)?.name}</p>
                    {slot.status === 'available' ? (
                        <button
                            onClick={() => onBlockSlot(slot)}
                            className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 flex justify-center items-center gap-2"
                        >
                            <Ban className="w-3 h-3" /> Bloquear
                        </button>
                    ) : (
                        <button disabled className="w-full py-2 bg-slate-200 text-slate-400 rounded-lg text-sm cursor-not-allowed">
                            No disponible
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};
