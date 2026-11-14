import { toast } from 'sonner';

/** Código ERR-XXXXXXXX que devuelve el backend cuando registró el error (si existe). */
export const getTrackingId = (error: unknown): string | undefined => {
  const id = (error as { response?: { data?: { tracking_id?: unknown } } })?.response?.data?.tracking_id;
  return typeof id === 'string' && id ? id : undefined;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const msg = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
  return typeof msg === 'string' && msg ? msg : fallback;
};

/** Muestra el error y, si hay código de seguimiento, un botón para copiarlo. */
export const toastApiError = (error: unknown, fallback: string, title?: string) => {
  const message = getApiErrorMessage(error, fallback);
  const trackingId = getTrackingId(error);
  const heading = title ?? message;
  const description = [title ? message : '', trackingId ? `Código de seguimiento: ${trackingId}` : '']
    .filter(Boolean)
    .join('\n');
  toast.error(heading, {
    description: description || undefined,
    duration: trackingId ? 12000 : undefined,
    action: trackingId
      ? { label: 'Copiar código', onClick: () => void navigator.clipboard?.writeText(trackingId) }
      : undefined,
  });
};
