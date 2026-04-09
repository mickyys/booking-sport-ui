"use client";
"use client";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { XCircle, CreditCard, ArrowRight } from 'lucide-react';

interface FailurePageProps {
    onRetry?: () => void;
    onGoHome?: () => void;
}

export const FailurePage: React.FC<FailurePageProps> = ({ onRetry, onGoHome }) => {
    const navigate = useNavigate();
    return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20 px-4">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
        >
            {/* Error Icon */}
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
                    <h1 className="text-3xl font-bold mb-2">Pago Rechazado</h1>
                    <p className="text-red-100">No se pudo procesar tu pago</p>
                </div>

                <div className="p-8">
                    <div className="space-y-6 mb-8">
                        <div className="p-6 bg-red-50 rounded-xl border border-red-100">
                            <h3 className="font-bold text-red-900 mb-3">Posibles razones del rechazo:</h3>
                            <ul className="space-y-2 text-sm text-red-800">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>Fondos insuficientes en tu cuenta</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>Datos de la transferencia incorrectos</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>Problema temporal con el banco o Fintoc</span>
                                </li>
                            </ul>
                        </div>                        

                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm text-slate-600 text-center">
                                No se ha realizado ningún cargo a tu cuenta
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={onRetry || (() => navigate('/reservar'))}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                        >
                            <CreditCard className="w-5 h-5" />
                            Intentar Nuevamente
                        </button>
                        <button 
                            onClick={onGoHome || (() => navigate('/'))}
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
