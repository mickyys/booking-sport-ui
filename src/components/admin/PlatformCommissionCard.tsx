"use client";
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Loader2, Lock, Percent } from 'lucide-react';
import { getCommercial, PlatformCommission } from '@/api/onboardingApi';

/**
 * Comisión de ReservaloYA por cada reserva pagada online.
 *
 * Es solo informativa: la define la plataforma. Solo se muestra cuando el
 * centro cobra online (con «solo reservas» no hay comisión por reserva).
 */
export const PlatformCommissionCard: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [commission, setCommission] = useState<PlatformCommission | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getAccessTokenSilently();
        const data = await getCommercial(token);
        if (active) setCommission(data.commission ?? null);
      } catch (e) {
        console.error('Error cargando la comisión:', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [getAccessTokenSilently]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" aria-label="Cargando comisión" />
      </div>
    );
  }

  if (!commission) return null;

  const billedSeparately = !commission.billed_in_split;

  return (
    <div className="border-t border-slate-200 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <Percent className="h-5 w-5 text-emerald-500" />
        <h4 className="text-base font-bold text-slate-900">Comisión de ReservaloYA</h4>
      </div>
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="min-w-[5rem] rounded-xl bg-white px-4 py-3 text-center text-2xl font-extrabold text-slate-900 ring-1 ring-slate-200">
          {billedSeparately ? '—' : `${commission.effective}%`}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            {billedSeparately ? 'Se factura aparte' : `${commission.effective}% por cada reserva pagada online`}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Este porcentaje lo define ReservaloYA. Si necesitas cambiarlo, contáctanos.
          </p>
        </div>
      </div>
    </div>
  );
};
