"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { CheckCircle2, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  apiErrorMessage,
  getSubscription,
  startSubscription,
  SubscriptionInfo,
} from '@/api/onboardingApi';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activa',
  PENDING: 'Pendiente de autorizar',
  PAUSED: 'En pausa',
  CANCELLED: 'Cancelada',
  NOT_CONFIGURED: 'Sin configurar',
};

const clp = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

interface SubscriptionCardProps {
  /** Se llama cuando cambia el estado (por ejemplo al volver de Mercado Pago). */
  onChange?: () => void;
}

/**
 * Suscripción mensual de la plataforma (modalidad "solo reservas").
 *
 * El botón crea la suscripción y lleva al usuario a Mercado Pago a autorizar el
 * cobro; el estado pasa a "Activa" cuando el backend recibe la confirmación.
 */
export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ onChange }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [applicable, setApplicable] = useState(true);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const data = await getSubscription(token);
      setApplicable(data.applicable !== false);
      setSub(data.subscription ?? null);
    } catch (e) {
      console.error('Error cargando la suscripción:', e);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    load();
  }, [load]);

  // Al volver de Mercado Pago en la misma pestaña (botón atrás) se relee el estado.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        load().then(() => onChange?.());
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load, onChange]);

  const start = async () => {
    setStarting(true);
    try {
      const token = await getAccessTokenSilently();
      const { init_point } = await startSubscription(token);
      if (!init_point) {
        toast.error('No se pudo generar el enlace de Mercado Pago. Intenta nuevamente.');
        return;
      }
      window.location.href = init_point;
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo iniciar la suscripción'));
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" aria-label="Cargando suscripción" />
      </div>
    );
  }

  if (!applicable) return null;

  const status = sub?.status || 'NOT_CONFIGURED';
  const active = status === 'ACTIVE';

  if (active) {
    return (
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
        <div className="flex items-start gap-4 p-5">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-emerald-900">Suscripción activa</h3>
            <p className="mt-1 text-sm text-emerald-700">
              {sub?.amount ? `${clp(sub.amount)} al mes. ` : ''}
              {sub?.next_charge_at
                ? `Próximo cobro: ${new Date(sub.next_charge_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-slate-100 p-3 text-slate-500">
            <Wallet size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900">Suscripción mensual</h3>
            <p className="mt-1 text-sm text-slate-600">
              Con la modalidad «solo reservas» tus clientes pagan en el centro y la plataforma se cobra con una
              suscripción mensual. Se autoriza una sola vez en Mercado Pago.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Estado: <span className="font-semibold">{STATUS_LABEL[status] ?? status}</span>
            </p>
            {sub?.first_month_free && (
              <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                Tu primer mes es gratis: el primer cobro será al mes siguiente de activarla.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
        <button
          type="button"
          onClick={start}
          disabled={starting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
        >
          {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck size={18} />}
          {starting
            ? 'Redirigiendo a Mercado Pago...'
            : status === 'PENDING'
              ? 'Completar suscripción'
              : 'Activar suscripción'}
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">
          Puedes finalizar el onboarding sin activarla y hacerlo después desde Configuración → Pagos.
        </p>
      </div>
    </div>
  );
};
