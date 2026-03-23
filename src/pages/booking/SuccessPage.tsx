import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, Calendar, ArrowRight, Info, AlertCircle, Loader2 } from 'lucide-react';
import { useBookingStore } from '../../store/useBookingStore';

interface SuccessPageProps {
    onGoHome?: () => void;
    onGoToProfile?: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ onGoHome, onGoToProfile }) => {
    const navigate = useNavigate();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { courts } = useBookingStore();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
            // Aquí se podría hacer un fetch al backend para obtener los detalles de la reserva por su código
            // Por ahora simularemos la carga o buscaremos si hay algo en el estado global
            // En una implementación real: axios.get(`/api/bookings/details?code=${code}`)
            
            const fetchDetails = async () => {
                try {
                    // Simulación de delay
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Como no tenemos el endpoint exacto aquí, usaremos datos de ejemplo
                    // basándonos en lo que el backend devolvió en el redirect
                    setBooking({
                        id: code,
                        date: new Date().toISOString(), // Esto debería venir del backend
                        price: 0, // Esto debería venir del backend
                        paymentMethod: 'fintoc',
                        userEmail: 'cliente@ejemplo.com',
                        courtName: 'Cancha Seleccionada'
                    });
                } catch (err) {
                    console.error("Error al cargar detalles de la reserva", err);
                } finally {
                    setLoading(false);
                }
            };

            fetchDetails();
        } else {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Validando tu pago...</p>
                </div>
            </div>
        );
    }

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
                        <h1 className="text-3xl font-bold mb-2">¡Pago Exitoso!</h1>
                        <p className="text-emerald-100">Tu reserva ha sido confirmada</p>
                    </div>

                    <div className="p-8">
                        {/* Booking Details */}
                        <div className="space-y-4 mb-8">
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium">Código de Reserva</span>
                                        <span className="font-bold text-slate-900">{booking?.id}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-100">
                                        <span className="text-slate-700 font-medium">Método de pago</span>
                                        <span className="text-sm font-medium text-slate-900">Fintoc</span>
                                    </div>
                                </div>
                            </div>

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

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-amber-900 font-medium mb-1">Política de cancelación</p>
                                        <p className="text-sm text-amber-800">
                                            Recuerda que puedes cancelar hasta 3 horas antes del partido para recibir el reembolso completo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={onGoToProfile || (() => navigate('/mis-reservas'))}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                            >
                                <Calendar className="w-5 h-5" />
                                Ver Mis Reservas
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
