"use client";
import React from 'react';
import { formatCountdown } from '../../lib/paymentWindow';
import { useCountdown } from '../../hooks/useCountdown';

interface SlotLockedNoticeProps {
  message: string;
  retryAfterSeconds: number;
}

/**
 * Contenido del aviso cuando otro usuario está pagando el horario. Muestra una
 * cuenta regresiva para que el cliente sepa cuándo puede reintentar.
 */
export const SlotLockedNotice: React.FC<SlotLockedNoticeProps> = ({ message, retryAfterSeconds }) => {
  const target = React.useMemo(
    () => new Date(Date.now() + Math.max(0, retryAfterSeconds) * 1000),
    [retryAfterSeconds]
  );
  const remaining = useCountdown(target);

  return (
    <div className="text-sm">
      <p>{message}</p>
      <p className="mt-1 font-semibold">
        {remaining > 0 ? `Podrás reintentar en ${formatCountdown(remaining)}` : 'Ya puedes reintentar'}
      </p>
    </div>
  );
};
