import React, { useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Booking, Court } from '../../types';

interface BookingCardProps {
    booking: Booking;
    courts: Court[];
    isLoading: boolean;
    onCancel: (id: string) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, courts, isLoading, onCancel }) => {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const bookingDate = parseISO(booking.date);

    const court = courts.find(
        (c) => c.id === booking.courtId
    ) || { name: 'Cancha', image: '' } as Court;

    const handleConfirmCancel = () => {
        onCancel(booking.id);
        setShowCancelModal(false);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4">

            {/* Info */}
            <div className="flex items-center gap-4 flex-1">
                <div className="bg-emerald-100 text-emerald-600 p-4 rounded-xl flex-shrink-0">
                    <Clock className="w-8 h-8" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-1 truncate">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {booking.sportCenterName}
                    </p>

                    <p className="font-bold text-lg text-slate-900">
                        {format(bookingDate, "EEEE d 'de' MMMM", { locale: es })}
                    </p>

                    <p className="text-slate-600">
                        {booking.hour !== undefined ? `${booking.hour}:00` : format(bookingDate, "HH:mm")} hrs •{" "}
                        {booking.courtName || court.name}
                    </p>
                    {booking.price !== undefined && (
                        <p className="font-bold text-emerald-700 mt-1">
                            ${booking.price.toLocaleString('es-CL')}
                        </p>
                    )}
                </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
                <span className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-sm border border-emerald-100 text-center">
                    Confirmado
                </span>

                <button
                    onClick={() => {
                        onCancel(booking.id);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg text-sm border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                    Cancelar Reserva
                </button>

            </div>
        </div>
    );
};
