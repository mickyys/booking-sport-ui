import { useEffect, useState } from 'react';
import { secondsUntil } from '../lib/paymentWindow';

/**
 * Segundos restantes hasta `target`, recalculados cada segundo. Acepta Date,
 * ISO string, timestamp en ms o null.
 */
export function useCountdown(target: Date | string | number | null | undefined): number {
  const key = target instanceof Date ? target.getTime() : target ? new Date(target).getTime() : 0;
  const [remaining, setRemaining] = useState(() => secondsUntil(target));

  useEffect(() => {
    setRemaining(secondsUntil(key));
    if (!key) return;
    const id = setInterval(() => setRemaining(secondsUntil(key)), 1000);
    return () => clearInterval(id);
  }, [key]);

  return remaining;
}
