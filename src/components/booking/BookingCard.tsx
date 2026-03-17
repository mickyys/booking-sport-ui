import React from 'react';
import { Clock, MapPin, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface BookingCardProps {
    booking: any; // Ideally we should use the Booking type from types/index.ts
    courts: any[];
    isLoading: boolean;
    onCancel: (id: string) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, courts, isLoading, onCancel }) => {
    const bookingDate = parseISO(booking.date);

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
                        {booking.hour !== undefined ? `${booking.hour}:00` : format(bookingDate, "HH:mm")} hrs •{" "}
                        {booking.court_name ||
                            courts.find(
                                (c) => c.id === booking.court_id || c.id === booking.courtId
                            )?.name ||
                            "Cancha"}
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
                    onClick={() => onCancel(booking.id)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 hover:text-blue-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cancelar Reserva"
                >
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Cancelar</span>
                </button>
            </div>

        </div>
    );
};
