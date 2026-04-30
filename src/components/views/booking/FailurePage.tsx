"use client";
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { XCircle, ArrowRight, AlertTriangle, Info, RefreshCw, Home, Calendar } from 'lucide-react';

interface FailurePageProps {
    onGoHome?: () => void;
    onRetry?: () => void;
    onGoToProfile?: () => void;
}

export const FailurePage: React.FC<FailurePageProps> = ({ onGoHome, onRetry, onGoToProfile }) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const code = searchParams.get('code');
    const reason = searchParams.get('reason');

    const getErrorMessage = () => {
        if (reason) {
            switch (reason) {
                case 'payment_failed':
                    return 'El pago no fue procesado correctamente. Por favor, verifica los datos de tu tarjeta e intenta nuevamente.';
                case 'payment_declined':
                    return 'El pago fue rechazado. Contacta a tu banco o intenta con otro método de pago.';
                case 'cancelled':
                    return 'La reserva fue cancelada.';
                case 'expired':
                    return 'El tiempo para completar el pago ha expirado. Por favor, realiza una nueva reserva.';
                case 'timeout':
                    return 'La operación tardó demasiado. Por favor, intenta nuevamente.';
                default:
                    return 'Hubo un problema al procesar tu reserva. Por favor, intenta nuevamente.';
            }
        }
        return 'Hubo un problema al procesar tu reserva. Por favor, intenta nuevamente.';
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-8 pb-20 px-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
            >
                {/* Failure Icon */}
                <div className="flex justify-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-xl"
                    >
                        <XCircle className="w-16 h-16 text-white" />
                    </motion.div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-white text-center">
                        <h1 className="text-3xl font-bold mb-2">Reserva Fallida</h1>
                        <p className="text-red-100">No se pudo completar tu reserva</p>
                    </div>

                    <div className="p-8">
                        {/* Error Details */}
                        <div className="space-y-6 mb-8">
                            {/* Error Message */}
                            <div className="p-5 bg-red-50 rounded-xl border border-red-100">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-red-800 font-medium mb-2">¿Qué pasó?</p>
                                        <p className="text-sm text-red-700">
                                            {getErrorMessage()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Code (if available) */}
                            {code && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 font-medium">Código de reserva</span>
                                        <span className="font-bold text-slate-900 text-lg">{code}</span>
                                    </div>
                                </div>
                            )}

                            {/* Help Info */}
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-900 font-medium mb-1">¿Necesitas ayuda?</p>
                                        <p className="text-sm text-blue-800">
                                            Si el problema persiste, contacta al Centro Deportivo directamente para más información.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            {onRetry && (
                                <button 
                                    onClick={onRetry}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Intentar Nuevamente
                                </button>
                            )}
                            {onGoToProfile && (
                                <button 
                                    onClick={onGoToProfile}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                                >
                                    <Calendar className="w-5 h-5" />
                                    Mis Reservas
                                </button>
                            )}
                            <button 
                                onClick={onGoHome || (() => router.push('/'))}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                Volver al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};