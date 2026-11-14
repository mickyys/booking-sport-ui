"use client";

import React from 'react';
import { Share2, MapPinned } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  kind: 'page' | 'location';
  title: string;
  text: string;
  /** Si no se entrega se usa la URL actual (página de reservas). */
  url?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export async function shareOrCopy({ title, text, url }: { title: string; text: string; url: string }) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Enlace copiado');
  } catch {
    toast.error('No se pudo copiar el enlace');
  }
}

export const ShareButton: React.FC<ShareButtonProps> = ({ kind, title, text, url, label, className, style }) => {
  const Icon = kind === 'page' ? Share2 : MapPinned;
  const defaultLabel = kind === 'page' ? 'Compartir' : 'Enviar ubicación';

  const handleClick = () => {
    const target = url || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '');
    void shareOrCopy({ title, text, url: target });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]'
      }
      style={style}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label ?? defaultLabel}
    </button>
  );
};
