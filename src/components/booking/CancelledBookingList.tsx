import React from 'react';
import { Ban, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Booking } from '../../types';

interface CancelledBookingListProps {
  bookings: Booking[];
  isLoading?: boolean;
}

export const CancelledBookingList: React.FC<CancelledBookingListProps> = ({ bookings, isLoading }) => {
  return (
    <div>
      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Ban className="w-5 h-5 text-red-500" />
        Reservas Canceladas
      </h3>
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 animate-pulse bg-slate-50 h-16" />
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {bookings.map((booking) => (
            <div key={booking.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900">{format(parseISO(booking.date), "d MMM yyyy")}</p>
                    <span className="text-slate-400">•</span>
                    <p className="text-slate-600 text-sm">{format(parseISO(booking.date), "HH:mm")} hrs</p>
                  </div>
                  <p className="text-sm text-slate-500">{booking.sportCenterName}</p>
                  <p className="text-sm text-slate-500">{booking.courtName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-500 line-through">${booking.price?.toLocaleString('es-CL')}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mt-1">
                    <X className="w-3 h-3" />
                    Cancelado
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center">
          <p className="text-slate-500 text-sm">No hay reservas canceladas.</p>
        </div>
      )}
    </div>
  );
};
