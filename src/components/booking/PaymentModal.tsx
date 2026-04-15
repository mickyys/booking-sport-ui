"use client";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, MapPin, CreditCard, ChevronRight, Info, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TimeSlot, Court, UserProfile, GuestDetails } from '../../types';
import { useBookingStore } from '../../store/useBookingStore';
import CancellationPolicyModal from '../search/CancellationPolicyModal';
import { toast } from 'sonner';
import axios from 'axios';

interface PaymentModalProps {
  slot: TimeSlot;
  court: Court;
  onClose: () => void;
  onConfirm: (method: 'mercadopago' | 'venue', guestDetails?: GuestDetails, partial?: boolean) => Promise<boolean | void>;
  user: UserProfile | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  slot,
  court,
  onClose,
  onConfirm,
  user
}) => {
  const { sportCenters, fetchSchedules } = useBookingStore();
  const center = sportCenters.find(c => c.id === slot.centerId);
  const [processing, setProcessing] = useState<null | 'mercadopago' | 'venue'>(null);
  const [showPolicies, setShowPolicies] = useState(false);
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });
  const [errors, setErrors] = useState<Partial<GuestDetails>>({});
  const [payPartial, setPayPartial] = useState(false);
  const hour = slot.date.getHours();
  // Determine if partial payment is available for this slot
  const isPartialAvailable = (() => {
    if (!center) return false;
    // Slot hierarchy: true/false overrides center, null inherits
    if (slot.partialPaymentEnabled === true) return true;
    if (slot.partialPaymentEnabled === false) return false;
    return !!center.partialPaymentEnabled;
  })();

  const partialAmount = isPartialAvailable && center?.partialPaymentPercent
    ? Math.round(slot.price * (center.partialPaymentPercent || 0 / 100))
    : 0;


  const validate = () => {
    const newErrors: Partial<GuestDetails> = {};
    if (!user && !guestDetails.name) newErrors.name = 'Requerido';
    if (!user && (!guestDetails.email || !guestDetails.email.includes('@'))) newErrors.email = 'Email inválido';
    if (!guestDetails.phone) newErrors.phone = 'Requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (method: 'mercadopago' | 'venue') => {
    if (!validate()) return;

    setProcessing(method);
    try {
      await onConfirm(method, guestDetails, payPartial);
      // If successful, the modal will likely close via parent state or navigation
    } catch (error) {
      console.error("Booking failed:", error);
      setProcessing(null); // Reset state on error so user can try again
      
      // If it was a concurrency error, refresh the schedules
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        if (slot.centerId) {
          fetchSchedules(slot.centerId, format(slot.date, 'yyyy-MM-dd'));
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto ${showPolicies ? 'hidden' : 'block'}`}
      >
        <div className="bg-slate-900 p-6 text-white flex justify-between items-start sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold">Confirmar Reserva</h3>
            <p className="text-slate-400 text-sm mt-1">
              {user ? `Reservando como ${user.name}` : 'Completa tus datos para reservar'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white" disabled={processing !== null}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <img src={court.image} alt="Cancha" className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="text-xs text-slate-400 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                {center?.name || 'Centro Deportivo'}
              </p>
              <p className="text-sm text-slate-500 uppercase font-semibold">{court.name}</p>
              <p className="font-bold text-slate-800">{format(slot.date, "EEEE d 'de' MMMM", { locale: es })}</p>
              <p className="text-emerald-600 font-medium">
                {format(slot.date, 'HH:mm')} hrs
              </p>
              <p className="text-slate-900 font-bold text-lg mt-1">${slot.price.toLocaleString('es-CL')}</p>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            {!user && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.name ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-emerald-200 outline-none`}
                    value={guestDetails.name}
                    onChange={e => setGuestDetails({ ...guestDetails, name: e.target.value })}
                    placeholder="Juan Pérez"
                    disabled={processing !== null}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.email ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-emerald-200 outline-none`}
                    value={guestDetails.email}
                    onChange={e => setGuestDetails({ ...guestDetails, email: e.target.value })}
                    placeholder="juan@ejemplo.com"
                    disabled={processing !== null}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  <p className="text-xs text-slate-500 mt-1">Enviaremos el comprobante a este correo.</p>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                className={`w-full px-4 py-2 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-emerald-200 outline-none`}
                value={guestDetails.phone}
                onChange={e => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                placeholder="+56 9 1234 5678"
                disabled={processing !== null}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {(slot.paymentRequired || slot.paymentOptional) && center && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPolicies(true)}
                  className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors text-sm font-medium"
                  disabled={processing !== null}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Ver políticas de cancelación
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">

          {isPartialAvailable && (
            <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-900">¿Pagar solo el abono ahora?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPayPartial(!payPartial)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    payPartial ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      payPartial ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {payPartial
                  ? `Pagarás $${partialAmount.toLocaleString('es-CL')} ahora y $${(slot.price - partialAmount).toLocaleString('es-CL')} en el club.`
                  : 'Pagarás el total de la reserva ahora.'}
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-blue-100/50">
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Monto a pagar:</span>
                <span className="text-lg font-black text-blue-700">
                  ${(payPartial ? partialAmount : slot.price).toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          )}

            <p className="text-sm font-medium text-slate-700 mb-2">
                {slot.paymentRequired ? 'Selecciona medio de pago:' : slot.paymentOptional ? 'Pago opcional — puedes pagar ahora o confirmar sin pagar' : 'Confirma tu reserva:'}
              </p>

              {slot.paymentRequired && (
                <button
                  disabled={processing !== null}
                  onClick={() => handlePayment('mercadopago')}
                  className={`w-full group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all ${processing === 'mercadopago'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-100 hover:border-blue-500 hover:bg-blue-50/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-slate-800 group-hover:text-blue-700">Pagar con MercadoPago</span>
                      <span className="text-xs text-slate-500">Crédito, Débito o Prepago</span>
                    </div>
                  </div>
                  {processing === 'mercadopago' ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                  )}
                </button>
              )}

              {slot.paymentOptional && !slot.paymentRequired && (
                <div className="space-y-3">
                  <button
                    disabled={processing !== null}
                    onClick={() => handlePayment('mercadopago')}
                    className={`w-full group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all ${processing === 'mercadopago'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-100 hover:border-blue-500 hover:bg-blue-50/30'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-slate-800 group-hover:text-blue-700">Pagar con MercadoPago (opcional)</span>
                        <span className="text-xs text-slate-500">Crédito, Débito o dinero en cuenta</span>
                      </div>
                    </div>
                    {processing === 'mercadopago' ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                    )}
                  </button>

                  <button
                    disabled={processing !== null}
                    onClick={() => handlePayment('venue')}
                    className={`w-full group relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white ${processing === 'venue' ? 'opacity-70' : ''
                      }`}
                  >
                    <span className="font-bold text-lg">Confirmar Reserva (sin pagar)</span>
                    {processing === 'venue' ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                </div>
              )}

              {!slot.paymentRequired && !slot.paymentOptional && (
                <button
                  disabled={processing !== null}
                  onClick={() => handlePayment('venue')}
                  className={`w-full group relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white ${processing === 'venue' ? 'opacity-70' : ''
                    }`}
                >
                  <span className="font-bold text-lg">Confirmar Reserva</span>
                  {processing === 'venue' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              )}
          </div>

          <div className="mt-6 flex items-start gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              {slot.paymentRequired
                ? 'Serás redirigido a la pasarela de pago segura. No almacenamos tus datos bancarios.'
                : 'Esta reserva no requiere pago previo. El pago se realiza directamente en el recinto.'
              }
            </p>
          </div>
        </div>
      </motion.div>

      {center && (
        <CancellationPolicyModal
          center={center}
          isOpen={showPolicies}
          onClose={() => setShowPolicies(false)}
        />
      )}
    </div>
  );
};
