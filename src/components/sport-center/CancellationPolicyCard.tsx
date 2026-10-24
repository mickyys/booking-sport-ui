"use client";

import React from 'react';
import { ShieldCheck, Clock, Percent, CreditCard } from 'lucide-react';
import { SportCenter } from '@/types';
import { BrandingPalette } from '@/utils/branding';

interface CancellationPolicyCardProps {
  center: SportCenter;
  branding: BrandingPalette;
}

export const CancellationPolicyCard: React.FC<CancellationPolicyCardProps> = ({ center, branding }) => {
  const hours = center.cancellationHours;
  const retention = center.retentionPercent;
  const hasCancellation = hours !== undefined && hours !== null;
  const hasPayment = center.payment_mode || center.partialPaymentEnabled;
  if (!hasCancellation && !hasPayment) return null;

  const rows: { Icon: React.ComponentType<{ className?: string }>; text: React.ReactNode }[] = [];

  if (hasCancellation) {
    rows.push({
      Icon: Clock,
      text: hours === 0 ? (
        <>Puedes cancelar sin costo <strong>hasta el inicio</strong> de tu reserva.</>
      ) : (
        <>Cancelación gratis hasta <strong>{hours} hora{hours !== 1 ? 's' : ''}</strong> antes de tu reserva.</>
      ),
    });
    if (retention !== undefined && retention !== null) {
      rows.push({
        Icon: Percent,
        text:
          retention === 100 ? (
            <>Si cancelas después, <strong>no hay devolución</strong>.</>
          ) : retention > 0 ? (
            <>Si cancelas después, se retiene el <strong>{retention}%</strong> del pago.</>
          ) : (
            <>Cancelar fuera de plazo no tiene costo.</>
          ),
      });
    }
  }

  if (center.payment_mode === 'pay_at_center') {
    rows.push({ Icon: CreditCard, text: <>Pagas directamente en el recinto.</> });
  } else if (center.partialPaymentEnabled && center.partialPaymentPercent) {
    rows.push({
      Icon: CreditCard,
      text: <>Reservas con un abono de <strong>{center.partialPaymentPercent}%</strong> y pagas el resto en el recinto.</>,
    });
  } else if (center.payment_mode === 'pay_online') {
    rows.push({ Icon: CreditCard, text: <>Pago en línea seguro con Mercado Pago.</> });
  }

  return (
    <section aria-labelledby="politicas-titulo" className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 id="politicas-titulo" className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
        <ShieldCheck className="h-5 w-5" style={{ color: branding.primary }} aria-hidden="true" />
        Políticas de cancelación
      </h2>
      <ul className="space-y-3">
        {rows.map(({ Icon, text }, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
