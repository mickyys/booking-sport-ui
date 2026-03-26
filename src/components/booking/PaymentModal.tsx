import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, MapPin, CreditCard, ChevronRight, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TimeSlot, Court, UserProfile, GuestDetails } from '../../types';
import { useBookingStore } from '../../store/useBookingStore';

interface PaymentModalProps {
  slot: TimeSlot;
  court: Court;
  onClose: () => void;
  onConfirm: (method: 'fintoc' | 'venue', guestDetails?: GuestDetails) => void;
  user: UserProfile | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  slot,
  court,
  onClose,
  onConfirm,
  user
}) => {
  const { sportCenters } = useBookingStore();
  const center = sportCenters.find(c => c.id === slot.centerId);
  const [processing, setProcessing] = useState<null | 'fintoc' | 'venue'>(null);
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });
  const [errors, setErrors] = useState<Partial<GuestDetails>>({});
  const hour = slot.date.getHours();

  const validate = () => {
    const newErrors: Partial<GuestDetails> = {};
    if (!user && !guestDetails.name) newErrors.name = 'Requerido';
    if (!user && (!guestDetails.email || !guestDetails.email.includes('@'))) newErrors.email = 'Email inválido';
    if (!guestDetails.phone) newErrors.phone = 'Requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = (method: 'fintoc' | 'venue') => {
    if (!validate()) return;

    setProcessing(method);
    setTimeout(() => {
      onConfirm(method, guestDetails);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-slate-900 p-6 text-white flex justify-between items-start sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold">Confirmar Reserva</h3>
            <p className="text-slate-400 text-sm mt-1">
              {user ? `Reservando como ${user.name}` : 'Completa tus datos para reservar'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
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
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-2">
                {slot.paymentRequired ? 'Selecciona medio de pago:' : slot.paymentOptional ? 'Pago opcional — puedes pagar ahora o confirmar sin pagar' : 'Confirma tu reserva:'}
              </p>

              {slot.paymentRequired && (
                <button
                  disabled={processing !== null}
                  onClick={() => handlePayment('fintoc')}
                  className={`w-full group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all ${processing === 'fintoc'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-slate-800 group-hover:text-indigo-700">Fintoc</span>
                      <span className="text-xs text-slate-500">Transferencia bancaria directa</span>
                    </div>
                  </div>
                  {processing === 'fintoc' ? (
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronRight className="text-slate-300 group-hover:text-indigo-500" />
                  )}
                </button>
              )}

              {slot.paymentOptional && !slot.paymentRequired && (
                <div className="space-y-3">
                  <button
                    disabled={processing !== null}
                    onClick={() => handlePayment('fintoc')}
                    className={`w-full group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all ${processing === 'fintoc'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/30'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-slate-800 group-hover:text-indigo-700">Pagar (opcional)</span>
                        <span className="text-xs text-slate-500">Paga ahora y asegura tu reserva</span>
                      </div>
                    </div>
                    {processing === 'fintoc' ? (
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="text-slate-300 group-hover:text-indigo-500" />
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
    </div>
  );
};
