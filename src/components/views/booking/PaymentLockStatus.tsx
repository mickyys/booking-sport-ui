"use client";
import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useCountdown } from '../../../hooks/useCountdown';
import { formatCountdown, santiagoClock } from '../../../lib/paymentWindow';

interface PaymentLockStatusProps {
  lockExpiresAt: string;
}

/**
 * Muestra cuánto falta para que el horario se libere cuando el pago sigue
 * pendiente. Al llegar a cero recarga la página una sola vez para reflejar el
 * estado real.
 */
export const PaymentLockStatus: React.FC<PaymentLockStatusProps> = ({ lockExpiresAt }) => {
  const remaining = useCountdown(lockExpiresAt);

  useEffect(() => {
    if (remaining > 0) return;
    const timeout = setTimeout(() => window.location.reload(), 3000);
    return () => clearTimeout(timeout);
  }, [remaining]);

  if (remaining <= 0) {
    return (
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
        <p className="text-sm font-semibold text-amber-900">El tiempo de espera terminó</p>
        <p className="text-xs text-amber-800 mt-1">
          El horario se liberó para otros usuarios. Si alcanzaste a pagar, la confirmación llega
          igual y te avisaremos por correo.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between gap-3 text-left">
      <div className="flex items-center gap-2 text-blue-900">
        <Clock className="w-4 h-4 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Horario reservado para ti</p>
          <p className="text-xs text-blue-800">
            Se libera a las {santiagoClock(lockExpiresAt)} si el pago no se confirma.
          </p>
        </div>
      </div>
      <span className="text-xl font-black text-blue-700 tabular-nums">{formatCountdown(remaining)}</span>
    </div>
  );
};
