import React from 'react';
import { toast } from 'sonner';
import { SlotLockedNotice } from './SlotLockedNotice';
import { SlotConflictInfo } from '../../lib/paymentWindow';

/**
 * Muestra el aviso de conflicto de horario. Cuando el horario ya fue confirmado
 * por otra persona el mensaje es explícito; cuando está en pago incluye la
 * cuenta regresiva hasta que el bloqueo se libere.
 */
export function showSlotConflictToast(conflict: SlotConflictInfo): void {
  if (conflict.kind === 'confirmed') {
    toast.error('Este horario ya fue reservado', {
      description:
        'La reserva se confirmó mientras esperabas. Actualizamos la disponibilidad; elige otro horario.',
      duration: 10000,
    });
    return;
  }

  if (conflict.retryAfterSeconds === null) {
    toast.error(conflict.message, { duration: 10000 });
    return;
  }

  toast.error(
    React.createElement(SlotLockedNotice, {
      message: conflict.message,
      retryAfterSeconds: conflict.retryAfterSeconds,
    }),
    { duration: Math.min(conflict.retryAfterSeconds, 3600) * 1000 + 4000 }
  );
}
