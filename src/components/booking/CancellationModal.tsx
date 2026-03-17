import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Ban, DollarSign, CreditCard } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Booking, Court } from '../../types';
import { toast } from 'sonner';

interface CancellationModalProps {
    booking: Booking;
    court: Court;
    onClose: () => void;
    onConfirm: (refundPercentage: number) => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
    booking,
    court,
    onClose,
    onConfirm
}) => {
    const [processing, setProcessing] = useState(false);

    const bookingDate = parseISO(booking.date);
    const now = new Date();
    const hoursUntilMatch = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Calcular porcentaje de reembolso
    // En este sistema, permitimos cancelar hasta 3 horas antes para 100% reembolso, 
    // sino 90% si es antes del inicio.
    const refundPercentage = hoursUntilMatch >= 3 ? 100 : 90;
    const refundAmount = (booking.price * refundPercentage) / 100;
    const fee = booking.price - refundAmount;

    const canCancel = hoursUntilMatch > 0;

    const handleConfirm = async () => {
        setProcessing(true);
        try {
            await onConfirm(refundPercentage);

            toast.success('¡Reserva cancelada exitosamente!', {
                description: `El reembolso del ${refundPercentage}% ha sido procesado vía ${booking.paymentMethod}.`
            });
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

    const getPaymentMethodIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'mercadopago':
            case 'fintoc':
            case 'flow':
                return 'bg-blue-100 text-blue-600';
            default:
                return 'bg-red-100 text-red-600';
        }
    };

    const getPaymentMethodName = (method: string) => {
        if (method.toLowerCase() === 'fintoc') return 'Fintoc / Flow';
        return method.charAt(0).toUpperCase() + method.slice(1);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
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

                <div className="p-6">
                    {/* Booking Details */}
                    <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {court.image && (
                            <img src={court.image} alt={court.name} className="w-16 h-16 rounded-lg object-cover" />
                        )}
                        <div className="flex-1">
                            <p className="text-sm text-slate-500 uppercase font-semibold">{court.name}</p>
                            <p className="font-bold text-slate-800">{format(bookingDate, "EEEE d 'de' MMMM", { locale: es })}</p>
                            <p className="text-emerald-600 font-medium">
                                {format(bookingDate, 'HH:mm')} hrs
                            </p>
                        </div>
                    </div>

                    {!canCancel ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                            <div className="flex items-start gap-3">
                                <Ban className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-red-900 mb-1">Cancelación no disponible</p>
                                    <p className="text-sm text-red-800">
                                        El partido ya ha comenzado o ha finalizado. No es posible cancelar esta reserva.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Refund Information */}
                            <div className={`p-5 rounded-xl mb-6 border-2 ${refundPercentage === 100
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-amber-50 border-amber-200'
                                }`}>
                                <div className="flex items-start gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${refundPercentage === 100
                                            ? 'bg-emerald-500'
                                            : 'bg-amber-500'
                                        }`}>
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold mb-1 ${refundPercentage === 100
                                                ? 'text-emerald-900'
                                                : 'text-amber-900'
                                            }`}>
                                            Reembolso del {refundPercentage}%
                                        </h4>
                                        <p className={`text-sm ${refundPercentage === 100
                                                ? 'text-emerald-800'
                                                : 'text-amber-800'
                                            }`}>
                                            {refundPercentage === 100
                                                ? `Estás cancelando con más de 3 horas de anticipación. Recibirás el reembolso completo.`
                                                : `Estás cancelando con menos de 3 horas de anticipación. Se aplicará un cargo del 10% por cancelación tardía.`
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-3 border-t border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">Monto original</span>
                                        <span className="font-medium text-slate-900">${booking.price.toLocaleString('es-CL')}</span>
                                    </div>
                                    {refundPercentage < 100 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600">Cargo por cancelación (10%)</span>
                                            <span className="font-medium text-red-600">-${fee.toLocaleString('es-CL')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                        <span className="font-bold text-slate-900">Reembolso total</span>
                                        <span className="text-2xl font-bold text-emerald-600">${refundAmount.toLocaleString('es-CL')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Time remaining info */}
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-900 font-medium mb-1">
                                            Tiempo restante hasta el partido
                                        </p>
                                        <p className="text-sm text-blue-800">
                                            Faltan <strong>{Math.floor(hoursUntilMatch)} horas y {Math.round((hoursUntilMatch % 1) * 60)} minutos</strong> para el inicio.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment method refund */}
                            <div className="p-4 bg-slate-50 rounded-xl mb-6">
                                <p className="text-sm text-slate-600 mb-2">Método de reembolso</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPaymentMethodIcon(booking.paymentMethod)}`}>
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-slate-900">
                                        {getPaymentMethodName(booking.paymentMethod)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    El reembolso se procesará de forma automática en 3-5 días hábiles a través de la plataforma de pago original.
                                </p>
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {canCancel && (
                            <button
                                onClick={handleConfirm}
                                disabled={processing}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                            className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors disabled:opacity-50"
                        >
                            {canCancel ? 'Mantener Reserva' : 'Cerrar'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
