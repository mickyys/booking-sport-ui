"use client";

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Send, PhoneCall, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSavedPhone } from '@/hooks/useSavedPhone';
import { formatChileanPhone, isValidChileanPhone } from '@/utils/phone';

interface FacilityBookingModalProps {
  title: string;
  subtitle: string;
  summary?: { label: string; value: string };
  brandColor: string;
  onClose: () => void;
  onSubmit: (details: { name: string; email: string; phone: string; message: string }) => Promise<void>;
  // Usuario logeado: no se piden nombre ni correo y el teléfono se precarga.
  user?: { name: string; email: string } | null;
  // 'booking' reserva directa (sin mensaje ni coordinación posterior);
  // 'inquiry' solicitud de arriendo que el centro debe coordinar.
  variant?: 'booking' | 'inquiry';
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export const FacilityBookingModal: React.FC<FacilityBookingModalProps> = ({
  title,
  subtitle,
  summary,
  brandColor,
  onClose,
  onSubmit,
  user = null,
  variant = 'inquiry',
}) => {
  const isBooking = variant === 'booking';
  const [form, setForm] = useState<FormState>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { phone: savedPhone, loaded: phoneLoaded, savePhone } = useSavedPhone(!!user);
  const loadingPhone = !!user && !phoneLoaded;

  useEffect(() => {
    if (!savedPhone) return;
    setForm((prev) => (prev.phone ? prev : { ...prev, phone: formatChileanPhone(savedPhone) }));
  }, [savedPhone]);

  const fields: { key: keyof FormState; label: string; placeholder: string; type: string }[] = [
    { key: 'name', label: 'Nombre completo', placeholder: 'Juan Pérez', type: 'text' },
    { key: 'email', label: 'Correo electrónico', placeholder: 'juan@ejemplo.com', type: 'email' },
    { key: 'phone', label: 'Teléfono', placeholder: '+56 9 1234 5678', type: 'tel' },
  ];
  const visibleFields = user ? fields.filter((f) => f.key === 'phone') : fields;

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!user && !form.name.trim()) e.name = 'Requerido';
    if (!user && !form.email.includes('@')) e.email = 'Email inválido';
    if (!form.phone.trim()) e.phone = 'Requerido';
    else if (!isValidChileanPhone(form.phone)) e.phone = 'Teléfono inválido (ej: +56 9 1234 5678)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (form.phone !== savedPhone) await savePhone(form.phone);
      await onSubmit({ name: form.name, email: form.email, phone: form.phone, message: form.message });
      setSubmitted(true);
      toast.success(
        title,
        isBooking ? undefined : { description: 'Te contactaremos en menos de 24 horas.' },
      );
    } catch (error) {
      toast.error(isBooking ? 'No se pudo realizar la reserva' : 'No se pudo enviar la solicitud', {
        description: 'Intenta nuevamente o contáctanos directamente.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 text-white" style={{ backgroundColor: '#0f172a' }}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-sm opacity-70 mt-0.5">{subtitle}</p>
            </div>
            <button onClick={onClose} className="opacity-60 hover:opacity-100">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: brandColor }}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {isBooking ? '¡Reserva realizada!' : '¡Solicitud enviada!'}
            </h3>
            {!isBooking && <p className="text-slate-500 mb-6">Nos contactaremos en menos de 24 horas</p>}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {summary && (
              <div className="p-4 rounded-xl border-2 flex items-center justify-between" style={{ borderColor: `${brandColor}40`, backgroundColor: `${brandColor}08` }}>
                <div>
                  <p className="text-xs text-slate-500">{summary.label}</p>
                  <p className="font-bold text-slate-900">{summary.value}</p>
                </div>
                <PhoneCall className="w-5 h-5" style={{ color: brandColor }} />
              </div>
            )}
            {!isBooking && (
              <p className="text-sm text-slate-500">Completa tus datos y nos contactaremos pronto para coordinar el arriendo.</p>
            )}

            {visibleFields.map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <div className="relative">
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [key]: key === 'phone' ? formatChileanPhone(e.target.value) : e.target.value }))
                  }
                  inputMode={key === 'phone' ? 'tel' : undefined}
                  autoComplete={key === 'phone' ? 'tel' : key === 'email' ? 'email' : 'name'}
                  placeholder={placeholder}
                  disabled={key === 'phone' && loadingPhone}
                  aria-busy={key === 'phone' && loadingPhone}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${
                    errors[key] ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-emerald-200'
                  }`}
                />
                {key === 'phone' && loadingPhone && (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1.5 text-xs text-slate-500" role="status">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Buscando teléfono…
                  </span>
                )}
                </div>
                {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
              </div>
            ))}

            {!isBooking && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje (opcional)</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Cuéntanos más sobre tu proyecto o necesidades..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-200 resize-none"
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: brandColor }}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isBooking ? 'Confirmar Reserva' : 'Enviar Solicitud'}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FacilityBookingModal;
