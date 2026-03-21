import React from 'react';
import { format, parseISO } from 'date-fns';

interface PastBookingItemProps {
    booking: any;
}

export const PastBookingItem: React.FC<PastBookingItemProps> = ({ booking }) => {
    return (
        <div className="p-4 border-b border-slate-100 last:border-0 flex justify-between items-center hover:bg-slate-50 transition-colors">
            <div>
                <p className="font-medium text-slate-900">
                    {format(parseISO(booking.date), "d MMM yyyy")} {booking.hour ? `• ${booking.hour}:00 hrs` : ''}
                </p>
                <p className="text-xs text-slate-500">
                    {booking.sportCenterName}
                </p>
                <p className="text-xs text-slate-500">
                    {booking.courtName}
                </p>
            </div>
            <span className="text-sm font-medium text-slate-600">
                {booking.price ? `$${booking.price.toLocaleString('es-CL')}` : 
                 booking.final_price ? `$${booking.final_price.toLocaleString('es-CL')}` : 'N/A'}
            </span>
        </div>
    );
};
