"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle, Users, CreditCard, Store, Loader2, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSavedPhone } from '@/hooks/useSavedPhone';
import { formatChileanPhone, isValidChileanPhone } from '@/utils/phone';
import {
  createFacilityBooking,
  getFacilityPaymentOptions,
  type CreateFacilityBookingResult,
  type FacilityPaymentOptions,
} from '@/api/bookingApi';

interface FacilityCheckoutModalProps {
  spaceId: string;
  spaceName: string;
  capacity: number;
  pricePerDay: number;
  dates: string[];
  brandColor: string;
  onClose: () => void;
  onBooked?: () => void;
  user?: { name: string; email: string } | null;
}

type Method = 'mercadopago' | 'venue';

const money = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

export const FacilityCheckoutModal: React.FC<FacilityCheckoutModalProps> = ({
  spaceId,
  spaceName,
  capacity,
  pricePerDay,
  dates,
  brandColor,
  onClose,
  onBooked,
  user = null,
}) => {
  const [guests, setGuests] = useState(1);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<FacilityPaymentOptions | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [method, setMethod] = useState<Method>('venue');
  const [partial, setPartial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<CreateFacilityBookingResult | null>(null);
  const { phone: savedPhone, loaded: phoneLoaded, savePhone } = useSavedPhone(!!user);
  const loadingPhone = !!user && !phoneLoaded;

  useEffect(() => {
    if (!savedPhone) return;
    setForm((prev) => (prev.phone ? prev : { ...prev, phone: formatChileanPhone(savedPhone) }));
  }, [savedPhone]);

  useEffect(() => {
    let cancelled = false;
    getFacilityPaymentOptions(spaceId)
      .then((o) => {
        if (cancelled) return;
        setOptions(o);
        if (o.default) setMethod(o.default);
      })
      .catch(() => !cancelled && setOptionsError(true));
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const total = pricePerDay * dates.length;
  const partialAmount = useMemo(
    () => (options?.partial_enabled ? Math.round((total * options.partial_percent) / 100) : total),
    [options, total],
  );
  const amountNow = method === 'mercadopago' ? (partial ? partialAmount : total) : 0;
  const noPaymentAvailable = !!options && !options.online && !options.venue;

  const validate = () => {
    const e: Record<string, string> = {};
    if (guests < 1) e.guests = 'Indica al menos 1 persona';
    if (!user && !form.name.trim()) e.name = 'Requerido';
    if (!user && !form.email.includes('@')) e.email = 'Email inválido';
    if (!form.phone.trim()) e.phone = 'Requerido';
    else if (!isValidChileanPhone(form.phone)) e.phone = 'Teléfono inválido (ej: +56 9 1234 5678)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !options) return;
    setSubmitting(true);
    try {
      if (form.phone !== savedPhone) await savePhone(form.phone);
      const res = await createFacilityBooking({
        space_id: spaceId,
        dates,
        guests,
        customer_name: user?.name || form.name,
        customer_email: user?.email || form.email,
        customer_phone: form.phone,
        payment_method: method,
        partial: method === 'mercadopago' && partial,
      });
      if (res.init_point) {
        window.location.href = res.init_point;
        return;
      }
      setDone(res);
      onBooked?.();
      toast.success('¡Reserva confirmada!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo realizar la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const fields: { key: 'name' | 'email' | 'phone'; label: string; placeholder: string; type: string }[] = [
    { key: 'name', label: 'Nombre completo', placeholder: 'Juan Pérez', type: 'text' },
    { key: 'email', label: 'Correo electrónico', placeholder: 'juan@ejemplo.com', type: 'email' },
    { key: 'phone', label: 'Teléfono', placeholder: '+56 9 1234 5678', type: 'tel' },
  ];
  const visibleFields = user ? fields.filter((f) => f.key === 'phone') : fields;

  const optionButton = (value: Method, label: string, hint: string, icon: React.ReactNode, enabled: boolean) => (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => setMethod(value)}
      aria-pressed={method === value}
      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all disabled:opacity-40 ${
        method === value ? 'bg-slate-50' : 'border-slate-200'
      }`}
      style={method === value ? { borderColor: brandColor } : undefined}
    >
      <span style={{ color: brandColor }}>{icon}</span>
      <span>
        <span className="block text-sm font-bold text-slate-900">{label}</span>
        <span className="block text-xs text-slate-600">{hint}</span>
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Reservar ${spaceName}`}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="p-6 text-white" style={{ backgroundColor: '#0f172a' }}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold">Reservar — {spaceName}</h3>
              <p className="mt-0.5 text-sm opacity-70">
                {dates.length} día{dates.length > 1 ? 's' : ''} seleccionado{dates.length > 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={onClose} aria-label="Cerrar" className="opacity-60 hover:opacity-100">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: brandColor }}>
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">¡Reserva realizada!</h3>
            <p className="mb-1 text-sm text-slate-600">Código de reserva</p>
            <p className="mb-4 font-mono text-lg font-bold text-slate-900">{done.booking_code}</p>
            <p className="mb-6 text-sm text-slate-600">
              Total a pagar en el centro: <strong>{money(done.total)}</strong>
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-xl py-3 font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">Cantidad de personas</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Menos personas"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="flex size-11 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={guests}
                  aria-label="Cantidad de personas"
                  onChange={(e) => setGuests(Math.max(0, Number(e.target.value) || 0))}
                  className="h-11 w-20 rounded-xl border border-slate-200 text-center text-base font-bold outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <button
                  type="button"
                  aria-label="Más personas"
                  onClick={() => setGuests((g) => g + 1)}
                  className="flex size-11 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {capacity > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-600">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" /> Capacidad: {capacity}
                  </span>
                )}
              </div>
              {errors.guests && <p className="mt-1 text-xs text-red-600">{errors.guests}</p>}
            </div>

            {visibleFields.map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
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
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 ${
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
                {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
              </div>
            ))}

            <div className="space-y-2">
              <span className="block text-sm font-medium text-slate-700">Forma de pago</span>
              {!options && !optionsError && (
                <div className="flex items-center gap-2 text-sm text-slate-600" role="status">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando opciones de pago
                </div>
              )}
              {optionsError && <p className="text-sm text-red-600">No se pudieron cargar las opciones de pago.</p>}
              {noPaymentAvailable && <p className="text-sm text-red-600">Este espacio no admite reservas por ahora.</p>}
              {options && (options.online || options.venue) && (
                <>
                  {options.online &&
                    optionButton('mercadopago', 'Pagar con Mercado Pago', 'Pago online seguro', <CreditCard className="h-5 w-5" />, true)}
                  {options.venue &&
                    optionButton('venue', 'Pagar en el centro', 'Reservas ahora, pagas al llegar', <Store className="h-5 w-5" />, true)}
                  {method === 'mercadopago' && options.partial_enabled && (
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={partial} onChange={(e) => setPartial(e.target.checked)} className="size-4" />
                      Pagar solo el abono ({options.partial_percent}%: {money(partialAmount)})
                    </label>
                  )}
                </>
              )}
            </div>

            <div className="rounded-xl border-2 p-4" style={{ borderColor: `${brandColor}40`, backgroundColor: `${brandColor}08` }}>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>
                  {dates.length} día{dates.length > 1 ? 's' : ''} × {money(pricePerDay)}
                </span>
                <span>{money(total)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-bold text-slate-900">{method === 'mercadopago' ? 'Pagas ahora' : 'Total'}</span>
                <span className="text-xl font-extrabold" style={{ color: brandColor }}>
                  {money(method === 'mercadopago' ? amountNow : total)}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !options || noPaymentAvailable}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: brandColor }}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : method === 'mercadopago' ? (
                'Continuar al pago'
              ) : (
                'Confirmar Reserva'
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FacilityCheckoutModal;
