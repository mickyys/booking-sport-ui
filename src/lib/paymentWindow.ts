const SANTIAGO_TZ = 'America/Santiago';

/**
 * Minutos que el horario sigue bloqueado después de que vence el link de pago
 * de Mercado Pago. Debe coincidir con `mpHoldGrace` del backend.
 */
export const PAYMENT_GRACE_MINUTES = 5;

export interface PaymentWindowInfo {
  bookingCode: string;
  initPoint: string;
  /** Hasta cuándo acepta pagos el link de Mercado Pago. */
  payUntil: Date | null;
  /** Hasta cuándo sigue bloqueado el horario (incluye la gracia del backend). */
  lockExpiresAt: Date | null;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Normaliza la respuesta de POST /bookings/mercadopago. Si el backend no envía
 * los vencimientos se calculan con la ventana base para no dejar la cuenta
 * regresiva sin datos.
 */
export function buildPaymentWindow(response: {
  init_point?: string;
  booking_code?: string;
  pay_until?: string | null;
  lock_expires_at?: string | null;
}): PaymentWindowInfo {
  const payUntil = toDate(response.pay_until);
  const lockExpiresAt = toDate(response.lock_expires_at);
  return {
    bookingCode: response.booking_code ?? '',
    initPoint: response.init_point ?? '',
    payUntil,
    lockExpiresAt,
  };
}

/** Segundos que faltan para un instante (nunca negativo). */
export function secondsUntil(target: Date | string | number | null | undefined): number {
  const date = target instanceof Date ? target : target ? new Date(target) : null;
  if (!date || Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000));
}

/** Formatea una duración en segundos como m:ss. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Hora local de Santiago (HH:MM) de un instante. */
export function santiagoClock(value: Date | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SANTIAGO_TZ,
  });
}

/** Texto humano del tiempo restante: "8 minutos", "menos de un minuto". */
export function humanRemaining(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'instantes';
  if (totalSeconds < 60) return 'menos de un minuto';
  const minutes = Math.ceil(totalSeconds / 60);
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
}

/** Tipo de conflicto 409 al intentar reservar un horario. */
export type SlotConflictKind = 'in_payment' | 'window_expired' | 'confirmed';

export interface SlotConflictInfo {
  kind: SlotConflictKind;
  message: string;
  /** Segundos hasta que se libera el horario; null si no aplica o el backend no lo informó. */
  retryAfterSeconds: number | null;
}

/**
 * Interpreta un 409 al reservar: horario en pago, ventana vencida o reserva ya
 * confirmada. Usa los datos estructurados del backend (`code`) y, si faltan
 * (backend antiguo), deduce el caso del texto.
 */
export function parseSlotConflict(error: unknown): SlotConflictInfo | null {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  if (!response || response.status !== 409) return null;
  const data = (response.data ?? {}) as {
    error?: string;
    code?: string;
    retry_after_seconds?: number;
    lock_expires_at?: string;
  };
  const message = data.error ?? '';

  const isConfirmed =
    data.code === 'slot_confirmed' ||
    /ya fue confirmad|reserva confirmada/i.test(message);
  if (isConfirmed) {
    return {
      kind: 'confirmed',
      message: message || 'este horario ya fue confirmado por otra persona',
      retryAfterSeconds: null,
    };
  }

  const isExpired = data.code === 'payment_window_expired';
  const isLock =
    isExpired ||
    data.code === 'slot_in_payment' ||
    /en proceso de pago|tiempo para pagar/i.test(message);
  if (!isLock) return null;

  let seconds: number | null = null;
  if (Number(data.retry_after_seconds) > 0) {
    seconds = Number(data.retry_after_seconds);
  } else if (data.lock_expires_at) {
    seconds = secondsUntil(data.lock_expires_at);
  } else {
    const m = message.match(/en (\d+) minutos?/i);
    if (m) seconds = Number(m[1]) * 60;
  }

  return {
    kind: isExpired ? 'window_expired' : 'in_payment',
    message: message || 'Otro usuario está pagando este horario.',
    retryAfterSeconds: seconds && seconds > 0 ? seconds : null,
  };
}
