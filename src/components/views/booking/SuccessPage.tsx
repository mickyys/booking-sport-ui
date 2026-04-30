"use client";
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckCircle, Calendar, ArrowRight, Info, AlertCircle, MapPin, Clock, CreditCard, User, Plane } from 'lucide-react';
import { useBookingStore } from '@/store/useBookingStore';

interface SuccessPageProps {
    onGoHome?: () => void;
    onGoToProfile?: () => void;
}

interface CancellationPolicy {
    limit_hours: number;
    retention_percent: number;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    mercadopago: 'MercadoPago',
    fintoc: 'Fintoc',
    cash: 'Efectivo en recinto',
    venue: 'Efectivo en recinto',
    internal: 'Interno',
    presential: 'Presencial',
};

export const SuccessPage: React.FC<SuccessPageProps> = ({ onGoHome, onGoToProfile }) => {
    const router = useRouter(); 
    const searchParams = useSearchParams();
    const { currentBooking, fetchBookingByCode } = useBookingStore();

    const code = searchParams.get('code');

    const booking = currentBooking;

    const paymentMethodLabel =
        PAYMENT_METHOD_LABELS[booking?.payment_method ?? ''] ?? 'Online';

    const cancellationPolicy = booking?.cancellationPolicy;
    const limitHours = cancellationPolicy?.limit_hours ?? 3;
    const retentionPercent = cancellationPolicy?.retention_percent ?? 10;

    const dateObj = booking?.date ? new Date(booking.date) : null;
    const formattedDate = dateObj
        ? dateObj.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '';
    const formattedTime = booking?.hour !== undefined
        ? `${String(booking.hour).padStart(2, '0')}:00 hrs`
        : '';

    const displayPrice = booking?.paidAmount ?? 0;
    const pendingAmount = booking?.pendingAmount ?? 0;
    const isTotalPaid = pendingAmount === 0;
    const centerName = booking?.sport_center_name ?? booking?.sportCenterName ?? 'Cancha';
    const courtName = booking?.court_name ?? booking?.courtName ?? 'Cancha';
    const bookingCode = booking?.booking_code ?? booking?.bookingCode ?? code;
    const isFreeBooking = booking?.payment_method === 'venue' || booking?.payment_method === 'cash';

    return (
        <div className="min-h-screen bg-slate-50 pt-8 pb-20 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
            >
                {/* Success Icon */}
                <div className="flex justify-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl"
                    >
                        <CheckCircle className="w-16 h-16 text-white" />
                    </motion.div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-white text-center">
                        <h1 className="text-3xl font-bold mb-2">
                            {isFreeBooking ? '¡Reserva Confirmada!' : '¡Pago Exitoso!'}
                        </h1>
                        <p className="text-emerald-100">
                            {isFreeBooking ? 'Tu reserva ha sido confirmada' : 'Tu reserva ha sido confirmada'}
                        </p>
                    </div>

                    <div className="p-8">
                        {/* Resumen completo de la reserva */}
                        <div className="space-y-4 mb-8">
                            {/* Código y método de pago */}
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 font-medium">Código de Reserva</span>
                                        <span className="font-bold text-slate-900 text-lg">{bookingCode}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-emerald-100">
                                        <span className="text-slate-700 font-medium">Método de pago</span>
                                        <span className="text-sm font-medium text-slate-900">{paymentMethodLabel}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detalles de la reserva */}
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                                <h3 className="font-semibold text-slate-800 mb-4">Detalles de tu reserva</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Centro Deportivo</p>
                                            <p className="text-sm font-medium text-slate-800">{centerName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Plane className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Cancha</p>
                                            <p className="text-sm font-medium text-slate-800">{courtName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Fecha</p>
                                            <p className="text-sm font-medium text-slate-800 capitalize">{formattedDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Hora</p>
                                            <p className="text-sm font-medium text-slate-800">{formattedTime}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Monto abonado</p>
                                            <p className="text-lg font-bold text-emerald-600">
                                                ${displayPrice?.toLocaleString('es-CL') ?? '0'}
                                            </p>
                                        </div>
                                    </div>

                                    {!isTotalPaid && (
                                        <div className="flex items-start gap-3">
                                            <CreditCard className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-500 uppercase tracking-wide">Monto pendiente</p>
                                                <p className="text-lg font-bold text-gray-600">
                                                    ${pendingAmount?.toLocaleString('es-CL') ?? '0'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* Información de confirmación */}
                            {!isFreeBooking && (
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-blue-900 font-medium mb-1">Confirmación enviada</p>
                                            <p className="text-sm text-blue-800">
                                                Hemos enviado los detalles de tu reserva a tu correo electrónico.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Política de cancelación */}
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-amber-900 font-medium mb-1">Política de cancelación</p>
                                        <p className="text-sm text-amber-800">
                                            {isFreeBooking ? (
                                                <>Puedes cancelar tu reserva contactando directamente con el centro deportivo.</>
                                            ) : (
                                                <>Puedes cancelar hasta <strong>{limitHours} horas antes</strong> del horario reservado para recibir el reembolso completo.
                                                {retentionPercent > 0 && (
                                                    <> Si cancelas con menos de {limitHours} horas, se retendrá el <strong>{retentionPercent}%</strong> como cargo por cancelación.</>
                                                )}</>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={onGoToProfile || (() => router.push('/mis-reservas'))}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                            >
                                <Calendar className="w-5 h-5" />
                                Ver Mis Reservas
                            </button>
                            <button
                                onClick={onGoHome || (() => router.push('/'))}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                            >
                                <ArrowRight className="w-5 h-5" />
                                Volver al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
