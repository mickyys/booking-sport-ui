"use client";
import React from 'react';
import { Clock, CreditCard, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { TimeSlot, Court } from '@/types';

interface BookingSlotCardProps {
  slot: TimeSlot;
  court?: Court;
  onClick: (slot: TimeSlot) => void;
}

export const BookingSlotCard: React.FC<BookingSlotCardProps> = ({ slot, court, onClick }) => {
  const isAvailable = slot.status === 'available';
  const isPassed = slot.status === 'passed';
  
  return (
    <motion.div
      key={slot.id}
      id={`slot-${slot.id}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={isAvailable ? { scale: 0.98 } : {}}
      onClick={() => isAvailable && onClick(slot)}
      className={`relative p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
        isAvailable
          ? 'bg-white border-slate-200 active:border-emerald-400 cursor-pointer shadow-sm active:shadow-md'
          : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Time and Status Icon */}
      <div className={`flex-shrink-0 p-3 rounded-xl ${
        isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'
      }`}>
        <Clock className="w-6 h-6" />
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-xl font-bold text-slate-900 leading-none">
            {format(slot.date, 'HH:mm')}
          </h3>
          {isAvailable && slot.paymentRequired && (
            <div className="flex items-center text-indigo-600" title="Pago requerido">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        <p className="text-slate-500 text-sm truncate">
          {court?.name || 'Cancha'} • {court?.type || 'Deporte'}
        </p>
      </div>

      {/* Price and CTA */}
      <div className="text-right flex flex-col items-end gap-1">
        <span className="font-black text-slate-900 text-lg leading-none">
          ${slot.price.toLocaleString('es-CL')}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${
          isAvailable 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-slate-200 text-slate-500'
        }`}>
          {isAvailable ? 'Disponible' : (isPassed ? 'Pasado' : 'Reservado')}
        </span>
      </div>

      {isAvailable && (
        <div className="flex-shrink-0 ml-1 text-slate-400 group-active:text-emerald-500">
          <ChevronRight className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
};

export default BookingSlotCard;
