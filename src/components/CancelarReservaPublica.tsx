import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useBookingStore } from '../store/useBookingStore';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, X, AlertCircle, DollarSign, Ban, Trophy, Clock, MapPin } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function CancelarReservaPublica() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const navigate = useNavigate();
  const { currentBooking, isLoading, fetchBookingByCode } = useBookingStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'cancelling'>('idle');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (code) fetchBookingByCode(code);
  }, [code, fetchBookingByCode]);

  const handleCancel = async () => {
    if (!code) return;
    setStatus('cancelling');
    try {
      await api.post(`/bookings/code/${code}/cancel`);
      setStatus('success');
      return true;
    } catch (err) {
      console.error('Cancel error', err);
      setStatus('error');
      return false;
    }
  };

  // Derived values from the fetched booking
  const booking = currentBooking;
  const bookingDate = booking && booking.date ? new Date(booking.date) : new Date();
  const now = new Date();
  const hoursUntilMatch = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const refundPercentage = booking ? (hoursUntilMatch >= 3 ? 100 : 90) : 100;
  const refundAmount = booking ? Math.round((booking.price * refundPercentage) / 100) : 0;
  const fee = booking ? booking.price - refundAmount : 0;
  const canCancel = booking ? hoursUntilMatch > 0 : false;

  console.log('Booking:', booking);

  const handleCancelClick = () => {
    if (!canCancel) {
      toast.error('No se puede cancelar esta reserva', {
        description: 'El partido ya ha comenzado o ha finalizado.'
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmCancellation = async () => {
    setProcessing(true);
    const success = await handleCancel();
    setProcessing(false);
    setShowConfirmModal(false);
    if (success) {
      toast.success('¡Reserva cancelada exitosamente!', {
        description: `Se reembolsará $${refundAmount.toLocaleString('es-CL')} (${refundPercentage}%) en 3-5 días hábiles.`,
        duration: 5000,
      });
    } else {
      toast.error('Error al cancelar la reserva');
    }
  };

  if (isLoading && !currentBooking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-4" />
        <p className="text-slate-500">Cargando reserva...</p>
      </div>
    );
  }

  if (!currentBooking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Reserva no encontrada</h2>
        <p className="text-slate-500 mb-6">El código proporcionado no corresponde a ninguna reserva.</p>
        <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl">Ir al inicio</button>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Cancelación exitosa!</h2>
          <p className="text-slate-600 mb-2">
            Tu reserva ha sido cancelada y procesaremos el reembolso.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-emerald-900 font-bold mb-1">
              Reembolso: ${refundAmount.toLocaleString('es-CL')} ({refundPercentage}%)
            </p>
            <p className="text-xs text-emerald-700">
              El dinero estará disponible en 3-5 días hábiles
            </p>
          </div>
          <Link
            to="/"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <nav className="bg-slate-900 border-b border-slate-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Trophy className="text-emerald-400 w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-bold text-lg sm:text-xl tracking-tight">Golazo<span className="text-emerald-400">Hub</span></span>
            </div>
            <Link to="/" className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors">
              Volver al sitio
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 sm:p-6 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Cancelar Reserva</h1>
            <p className="text-sm sm:text-base text-red-100">Gestiona tu reserva de forma rápida y segura</p>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {/* Booking Details */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Detalles de tu reserva</h2>
              <div className="flex items-start gap-3 sm:gap-4 bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">            
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-slate-500 uppercase font-semibold truncate">{currentBooking.courtName}</p>
                      <p className="font-bold text-base sm:text-xl text-slate-900">{format(bookingDate, "EEEE d 'de' MMMM", { locale: es })}</p>
                      <p className="text-emerald-600 font-bold flex items-center gap-1.5 sm:gap-2 mt-1">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="text-sm sm:text-base">{format(bookingDate, 'HH:mm')} hrs</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-xl sm:text-2xl font-bold text-slate-900">${currentBooking.price.toLocaleString('es-CL')}</p>
                      <p className="text-xs sm:text-sm text-slate-500 capitalize">{currentBooking.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs sm:text-sm text-slate-600 break-words">
                      <span className="font-bold text-slate-900">Reservado a nombre de:</span> {currentBooking.guestDetails?.name || currentBooking.customerName}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 break-words">
                      <span className="font-bold text-slate-900">Email:</span> {currentBooking.guestDetails?.email || currentBooking.customerEmail}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 break-all">
                      Código de reserva: <span className="font-mono font-bold">{currentBooking.bookingCode}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Refund Information */}
            {!canCancel ? (
              <div className="p-4 sm:p-6 bg-red-50 border-2 border-red-200 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <Ban className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900 mb-1 text-base sm:text-lg">Cancelación no disponible</p>
                    <p className="text-sm text-red-800">
                      El partido ya ha comenzado o ha finalizado. No es posible cancelar esta reserva.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className={`p-4 sm:p-6 rounded-xl mb-6 sm:mb-8 border-2 ${
                  refundPercentage === 100 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      refundPercentage === 100 
                        ? 'bg-emerald-500' 
                        : 'bg-amber-500'
                    }`}>
                      <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-lg sm:text-xl mb-1.5 sm:mb-2 ${
                        refundPercentage === 100 
                          ? 'text-emerald-900' 
                          : 'text-amber-900'
                      }`}>
                        Reembolso del {refundPercentage}%
                      </h3>
                      <p className={`text-xs sm:text-sm ${
                        refundPercentage === 100 
                          ? 'text-emerald-800' 
                          : 'text-amber-800'
                      }`}>
                        {refundPercentage === 100 
                          ? '¡Felicidades! Recibirás el 100% de reembolso porque faltan más de 3 horas para tu partido.' 
                          : 'Recibirás el 90% de reembolso porque faltan menos de 3 horas para tu partido.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base text-slate-600">Precio original:</span>
                      <span className="font-bold text-sm sm:text-base text-slate-900">${currentBooking.price.toLocaleString('es-CL')}</span>
                    </div>
                    {refundPercentage < 100 && (
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-slate-500">Cargo por cancelación tardía (10%):</span>
                        <span className="text-red-600 font-medium">-${fee.toLocaleString('es-CL')}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-bold text-slate-900">Reembolso total:</span>
                        <span className={`text-xl sm:text-2xl font-bold ${
                          refundPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          ${refundAmount.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cancellation Policy Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-blue-900">
                      <p className="font-bold mb-1">Política de Cancelación</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-800">
                        <li>Cancelación con 3+ horas de anticipación: reembolso del 100%</li>
                        <li>Cancelación con menos de 3 horas: reembolso del 90%</li>
                        <li>El reembolso se procesará al método de pago original</li>
                        <li>Tiempo de procesamiento: 3-5 días hábiles</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={handleCancelClick}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl text-base sm:text-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  Cancelar mi reserva
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Footer Info */}
        <div className="mt-6 sm:mt-8 text-center text-slate-600 text-xs sm:text-sm">
          <p className="mb-2">¿Necesitas ayuda? Contáctanos:</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 px-4">
            <span className="flex items-center gap-1.5 sm:gap-2">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="break-words">Av. del Deporte 1234, Santiago</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">+56 9 1234 5678</span>
            <span className="hidden sm:inline">•</span>
            <span className="break-words">contacto@golazohub.cl</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-red-500 p-4 sm:p-6 text-white">
              <h3 className="text-xl sm:text-2xl font-bold">Confirmar cancelación</h3>
            </div>
            
            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-slate-700 mb-4 sm:mb-6">
                ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
              </p>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm font-bold text-emerald-900 mb-1">
                  Recibirás un reembolso de:
                </p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                  ${refundAmount.toLocaleString('es-CL')} ({refundPercentage}%)
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base transition-colors"
                  disabled={processing}
                >
                  No, mantener reserva
                </button>
                <button
                  onClick={handleConfirmCancellation}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Cancelando...</span>
                    </>
                  ) : (
                    <>Sí, cancelar</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
