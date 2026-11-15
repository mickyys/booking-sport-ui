import React from 'react';
import { toast } from 'sonner';
import { SlotLockedNotice } from './SlotLockedNotice';
import { parseSlotLock } from '../../lib/paymentWindow';

/**
 * Muestra el aviso de "horario en pago" con cuenta regresiva. Devuelve false
 * si el error no corresponde, para que el llamador use su mensaje genérico.
 */
export function showSlotLockToast(error: unknown): boolean {
  const info = parseSlotLock(error);
  if (!info) return false;
  if (info.retryAfterSeconds === null) {
    toast.error(info.message, { duration: 10000 });
    return true;
  }
  toast.error(
    React.createElement(SlotLockedNotice, {
      message: info.message,
      retryAfterSeconds: info.retryAfterSeconds,
    }),
    { duration: Math.min(info.retryAfterSeconds, 3600) * 1000 + 4000 }
  );
  return true;
}
