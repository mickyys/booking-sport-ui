import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Ban, DollarSign, CreditCard, Calendar, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookingDetailResponse } from '../../types';
import { toast } from 'sonner';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';

interface CancellationModalProps {
    bookingId?: string;
    bookingCode?: string;
    onClose: () => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
    bookingId,
    bookingCode,
    onClose,
}) => {
    const { getAccessTokenSilently } = useAuth0();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [detail, setDetail] = useState<BookingDetailResponse | null>(null);
    const { fetchBookingDetail, fetchCancelledBookings, fetchBookingByCode, fetchMyBookings, cancelBooking } = useBookingStore(); // Solo para obtener las funciones necesarias

    useEffect(() => {

        const loadBookingDetail = async () => {
            if (!bookingId && !bookingCode) return;

            try {
                let data;
                if (bookingId) {
                    data = await fetchBookingDetail(bookingId, getAccessTokenSilently);
                } else if (bookingCode) {
                    data = await fetchBookingByCode(bookingCode);
                }

                setDetail(data);
                setLoading(false);

            } catch (error) {
                console.error('Error loading booking detail:', error);
                toast.error('Error al cargar información de la reserva');
                onClose();
            }
        };
        loadBookingDetail();
    }, [bookingId, bookingCode, fetchBookingDetail, fetchBookingByCode, getAccessTokenSilently]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">Cargando detalles...</p>
                </div>
            </div>
        );
    }

    if (!detail) return null;
    console.log('Booking detail:', detail);
    const { booking_detail: booking, cancellation_policy, hours_until_match, can_cancel, refund_percentage, max_refund_amount } = detail;

    const bookingDate = parseISO(booking.date);
    const fee = booking.price - max_refund_amount;

    const handleConfirm = async () => {
        setProcessing(true);
        try {
             await cancelBooking(booking.id, getAccessTokenSilently);
            // Refrescar las listas de bookings
            await fetchMyBookings(getAccessTokenSilently, false);
            await fetchMyBookings(getAccessTokenSilently, true);
            await fetchCancelledBookings(getAccessTokenSilently, 1, 5);
            onClose();
        } catch (error: any) {
            console.error('Error al cancelar reserva:', error);
            const errorMessage = error.response?.data?.error || 'No se pudo procesar la cancelación. Intenta más tarde.';
            toast.error('Error al cancelar', {
                description: errorMessage
            });
        } finally {
            setProcessing(false);
        }
    };
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold">Cancelar Reserva</h3>
                        <p className="text-red-100 text-sm mt-1">Confirma la cancelación de tu partido</p>
                    </div>
                    <button onClick={onClose} className="text-red-100 hover:text-white" disabled={processing}>
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Booking Details */}
                    <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">{booking.sport_center_name}</p>
                            <p className="text-base text-slate-800 font-bold leading-tight">{booking.court_name}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                <p className="font-medium text-slate-600 flex items-center gap-1.5 text-sm">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {format(bookingDate, "EEEE d 'de' MMMM", { locale: es })}
                                </p>
                                <p className="text-emerald-600 font-bold flex items-center gap-1.5 text-sm">
                                    <Clock className="w-3.5 h-3.5" />
                                    {booking.hour}:00 hrs
                                </p>
                            </div>
                            <p className="text-[9px] text-slate-300 mt-2 font-mono">Código: {booking.booking_code}</p>
                        </div>
                    </div>

                    {!can_cancel ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                            <div className="flex items-start gap-3">
                                <Ban className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-red-900 mb-1">Cancelación no disponible</p>
                                    <p className="text-sm text-red-800">
                                        El partido ya ha comenzado, está muy próximo o ha finalizado. No es posible cancelar esta reserva según las políticas del centro.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Refund Information - hide when payment was made 'venue' (presencial) */}
                            {booking.payment_method !== 'venue' && (
                                <div className={`p-5 rounded-xl mb-6 border-2 ${refund_percentage === 100
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-amber-50 border-amber-200'
                                    }`}>
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${refund_percentage === 100
                                            ? 'bg-emerald-500'
                                            : 'bg-amber-500'
                                            }`}>
                                            <DollarSign className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-bold mb-1 ${refund_percentage === 100
                                                ? 'text-emerald-900'
                                                : 'text-amber-900'
                                                }`}>
                                                Reembolso del {refund_percentage}%
                                            </h4>
                                            <p className={`text-sm ${refund_percentage === 100
                                                ? 'text-emerald-800'
                                                : 'text-amber-800'
                                                }`}>
                                                {refund_percentage === 100
                                                    ? `Estás cancelando con más de ${cancellation_policy.limit_hours} horas de anticipación. Recibirás el reembolso completo.`
                                                    : `Estás cancelando con menos de ${cancellation_policy.limit_hours} horas de anticipación. Se aplicará un cargo del ${cancellation_policy.retention_percent}% por cancelación tardía.`
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600">Monto original</span>
                                            <span className="font-medium text-slate-900">${booking.price.toLocaleString('es-CL')}</span>
                                        </div>
                                        {refund_percentage < 100 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600">Cargo por cancelación ({cancellation_policy.retention_percent}%)</span>
                                                <span className="font-medium text-red-600">-${fee.toLocaleString('es-CL')}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                            <span className="font-bold text-slate-900">Reembolso total</span>
                                            <span className="text-2xl font-bold text-emerald-600">${max_refund_amount.toLocaleString('es-CL')}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Time remaining info */}
                            {booking.payment_method !== 'venue' && (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-blue-900 font-medium mb-1">
                                                Tiempo restante hasta el partido
                                            </p>
                                            <p className="text-sm text-blue-800">
                                                Faltan <strong>{Math.floor(hours_until_match)} horas y {Math.round((hours_until_match % 1) * 60)} minutos</strong> para el inicio.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment method refund */}
                            {booking.payment_method !== 'venue' && (
                                <div className="p-4 bg-slate-50 rounded-xl mb-6">
                                    <p className="text-sm text-slate-600 mb-2">Método de reembolso</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-slate-900">
                                            { booking.payment_method === 'venue' ? 'Presencial' : 'Fintoc'}
                                        </span>
                                    </div>
                                    {booking.payment_method !== 'venue' ? (
                                        <p className="text-xs text-slate-500 mt-2">
                                            El reembolso se procesará de forma automática en 3-5 días hábiles a través de la plataforma de pago original.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-slate-500 mt-2">
                                            El reembolso para pagos presenciales se gestiona directamente con el centro deportivo.
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer - fixed actions */}
                <div className="p-4 bg-white border-t flex flex-col gap-3">
                    {can_cancel && (
                        <button
                            onClick={handleConfirm}
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Ban className="w-5 h-5" />
                                    Confirmar Cancelación
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="w-full px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors disabled:opacity-50"
                    >
                        {can_cancel ? 'Mantener Reserva' : 'Cerrar'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};