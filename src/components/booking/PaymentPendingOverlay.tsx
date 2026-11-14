"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, ExternalLink, RefreshCw, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useBookingStore } from '../../store/useBookingStore';
import { useCountdown } from '../../hooks/useCountdown';
import {
  PaymentWindowInfo,
  formatCountdown,
  santiagoClock,
} from '../../lib/paymentWindow';

interface PaymentPendingOverlayProps {
  payment: PaymentWindowInfo;
  onClose: () => void;
}

type Phase = 'paying' | 'grace' | 'released' | 'confirmed' | 'cancelled';

/**
 * Se muestra en la pestaña original mientras el cliente paga en Mercado Pago.
 * Lleva la cuenta regresiva del link de pago, avisa cuando vence y consulta el
 * estado de la reserva hasta que se confirma o se libera el horario.
 */
export const PaymentPendingOverlay: React.FC<PaymentPendingOverlayProps> = ({ payment, onClose }) => {
  const fetchBookingByCode = useBookingStore((s) => s.fetchBookingByCode);
  const resetCurrentBooking = useBookingStore((s) => s.resetCurrentBooking);
  const payRemaining = useCountdown(payment.payUntil);
  const lockRemaining = useCountdown(payment.lockExpiresAt);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'cancelled' | 'error'>('pending');
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);

  const checkStatus = React.useCallback(async () => {
    if (!payment.bookingCode || checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    try {
      const data = await fetchBookingByCode(payment.bookingCode);
      const bookingStatus = data?.booking_detail?.status;
      if (bookingStatus === 'confirmed') setStatus('confirmed');
      else if (bookingStatus === 'cancelled') setStatus('cancelled');
      else setStatus('pending');
    } catch {
      setStatus('error');
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, [fetchBookingByCode, payment.bookingCode]);

  // Consulta periódica mientras el pago no está resuelto.
  useEffect(() => {
    if (!payment.bookingCode) return;
    if (status === 'confirmed' || status === 'cancelled' || status === 'error') return;
    const id = setInterval(() => {
      void checkStatus();
    }, 8000);
    return () => clearInterval(id);
  }, [checkStatus, payment.bookingCode, status]);

  useEffect(() => {
    if (status === 'confirmed') {
      const timeout = setTimeout(() => {
        window.location.href = `/booking/success?code=${encodeURIComponent(payment.bookingCode)}`;
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [status, payment.bookingCode]);

  useEffect(() => () => resetCurrentBooking(), [resetCurrentBooking]);

  // Sin datos de vencimiento (backend antiguo) no se puede deducir la fase:
  // se mantiene el aviso de espera sin cuenta regresiva.
  const hasWindow = Boolean(payment.payUntil || payment.lockExpiresAt);
  let phase: Phase = 'paying';
  if (status === 'confirmed') phase = 'confirmed';
  else if (status === 'cancelled') phase = 'cancelled';
  else if (!hasWindow) phase = 'paying';
  else if (payRemaining <= 0 && lockRemaining <= 0) phase = 'released';
  else if (payRemaining <= 0) phase = 'grace';

  const title =
    phase === 'confirmed'
      ? '¡Pago confirmado!'
      : phase === 'cancelled'
        ? 'El horario ya no está disponible'
        : phase === 'released'
          ? 'El tiempo para pagar venció'
          : phase === 'grace'
            ? 'Tiempo de pago agotado'
            : 'Completa el pago en la otra pestaña';

  const description =
    phase === 'confirmed'
      ? 'Estamos abriendo el detalle de tu reserva.'
      : phase === 'cancelled'
        ? 'Otra persona confirmó este horario. Si el pago se cobró, se reembolsará automáticamente.'
        : phase === 'released'
          ? 'El horario quedó libre. Puedes volver a la agenda y reservar.'
          : phase === 'grace'
            ? `El link de pago ya no acepta pagos. Mantuvimos el horario bloqueado hasta las ${santiagoClock(payment.lockExpiresAt)} por si tu pago alcanzó a procesarse.`
            : 'Termina el pago en la pestaña de Mercado Pago que abrimos. No cierres esta pantalla: aquí verás cuando se confirme.';

  const icon =
    phase === 'confirmed' ? (
      <CheckCircle2 className="w-10 h-10 text-white" />
    ) : phase === 'cancelled' || phase === 'released' ? (
      <AlertTriangle className="w-10 h-10 text-white" />
    ) : (
      <Clock className="w-10 h-10 text-white" />
    );

  const headerColor =
    phase === 'confirmed'
      ? 'from-emerald-500 to-emerald-600'
      : phase === 'cancelled' || phase === 'released'
        ? 'from-amber-500 to-amber-600'
        : 'from-blue-500 to-blue-600';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className={`bg-gradient-to-r ${headerColor} p-6 text-white flex items-start justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">{icon}</div>
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-white/80 text-xs mt-1">Reserva {payment.bookingCode || 'en proceso'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">{description}</p>

          {phase === 'paying' && hasWindow && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4">
              <span className="text-sm font-medium text-blue-900">Tiempo para pagar</span>
              <span className="text-2xl font-black text-blue-700 tabular-nums">{formatCountdown(payRemaining)}</span>
            </div>
          )}

          {(phase === 'paying' || phase === 'grace') && hasWindow && (
            <div className="text-xs text-slate-500 space-y-1">
              {payment.payUntil && (
                <p>
                  Vence a las <span className="font-semibold">{santiagoClock(payment.payUntil)}</span>.
                </p>
              )}
              {payment.lockExpiresAt && (
                <p>
                  El horario sigue bloqueado para otros hasta las{' '}
                  <span className="font-semibold">{santiagoClock(payment.lockExpiresAt)}</span>.
                </p>
              )}
            </div>
          )}

          {phase === 'paying' && payment.initPoint && (
            <a
              href={payment.initPoint}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Mercado Pago
            </a>
          )}

          {(phase === 'paying' || phase === 'grace') && (
            <button
              onClick={() => void checkStatus()}
              disabled={checking || !payment.bookingCode}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              Ya pagué, verificar
            </button>
          )}

          {(phase === 'released' || phase === 'cancelled') && (
            <button
              onClick={() => {
                onClose();
                window.location.href = '/';
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
            >
              Volver a la agenda
            </button>
          )}

          {status === 'error' && (
            <p className="text-xs text-red-600">
              No pudimos verificar el pago. Usa &quot;Ya pagué, verificar&quot; o revisa tu correo.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
