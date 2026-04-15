"use client";
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

                {booking.isPartialPayment && (
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">
                        Abono: ${booking.paidAmount?.toLocaleString('es-CL')}
                    </p>
                )}
            </div>
            <div className="text-right">
                <span className="text-sm font-bold text-slate-600 block">
                    {booking.price ? `$${booking.price.toLocaleString('es-CL')}` :
                    booking.final_price ? `$${booking.final_price.toLocaleString('es-CL')}` : 'N/A'}
                </span>
                {booking.isPartialPayment && (
                    <span className="text-[10px] font-medium text-slate-400">Total</span>
                )}
            </div>
        </div>
    );
};
