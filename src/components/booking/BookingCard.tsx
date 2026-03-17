import React, { useState } from 'react';
import { Clock, MapPin, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Booking, Court } from '../../types';
import { CancellationModal } from './CancellationModal';

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
        (c) => c.id === booking.courtId || c.id === (booking as any).court_id
    ) || { name: 'Cancha', image: '' } as Court;

    const handleConfirmCancel = (refundPercentage: number) => {
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
                        {booking.sport_center_name}
                    </p>

                    <p className="font-bold text-lg text-slate-900">
                        {format(bookingDate, "EEEE d 'de' MMMM", { locale: es })}
                    </p>

                    <p className="text-slate-600">
                        {(booking as any).hour !== undefined ? `${(booking as any).hour}:00` : format(bookingDate, "HH:mm")} hrs •{" "}
                        {(booking as any).court_name || court.name}
                    </p>
                    {booking.price && (
                        <p className="font-bold text-emerald-700 mt-1">
                            ${booking.price.toLocaleString('es-CL')}
                        </p>
                    )}
                </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:items-end gap-2 mt-4 sm:mt-0">
                <span className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-sm border border-emerald-100 whitespace-nowrap">
                    Confirmado
                </span>

                <button
                    disabled={isLoading}
                    onClick={() => setShowCancelModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 hover:text-blue-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cancelar Reserva"
                >
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Cancelar</span>
                </button>
            </div>

            {showCancelModal && (
                <CancellationModal 
                    booking={booking}
                    court={court}
                    onClose={() => setShowCancelModal(false)}
                    onConfirm={handleConfirmCancel}
                />
            )}

        </div>
    );
};
