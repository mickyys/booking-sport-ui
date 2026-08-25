"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, CreditCard, ShoppingBag, Store } from 'lucide-react';
import { MPConnectCard } from '@/components/admin/MPConnectCard';
import { useAdminPanel } from '@/context/AdminPanelContext';

const steps = [
  {
    icon: Store,
    title: 'Tu centro deportivo',
    description: 'Tu centro ya está registrado en ReservaloYA.',
  },
  {
    icon: CreditCard,
    title: 'Conecta Mercado Pago',
    description: 'Autoriza los pagos online de tus reservas.',
  },
  {
    icon: ShoppingBag,
    title: 'Recibe pagos online',
    description: 'Tus clientes pagan directo en tu cuenta de Mercado Pago.',
  },
];

export const OnboardingView: React.FC = () => {
  const { currentSportCenter } = useAdminPanel();
  const searchParams = useSearchParams();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; traceId?: string } | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    const traceId = searchParams.get('trace_id') || undefined;
    if (status === 'success') {
      setFeedback({
        type: 'success',
        message: 'Tu cuenta de Mercado Pago fue conectada correctamente.',
        traceId,
      });
    } else if (status === 'error') {
      const reason = searchParams.get('reason') || 'callback_failed';
      setFeedback({
        type: 'error',
        message:
          reason === 'missing_code'
            ? 'No se recibió el código de autorización de Mercado Pago.'
            : 'Ocurrió un problema al conectar tu cuenta. Inténtalo nuevamente.',
        traceId,
      });
    }
    if (status) {
      window.history.replaceState({}, '', '/admin/onboarding');
    }
  }, [searchParams]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Onboarding
        </h1>
        <p className="text-slate-500 mt-1">
          {currentSportCenter?.name ? `Centro: ${currentSportCenter.name}` : 'Configura tu integración'}
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={20} className="flex-shrink-0" />
          ) : (
            <AlertCircle size={20} className="flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold">{feedback.message}</p>
            {feedback.traceId && (
              <p className="text-xs mt-1 font-mono opacity-80 break-all">ID de error: {feedback.traceId}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, index) => (
          <div key={step.title} className="p-5 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                {index + 1}
              </div>
              <step.icon size={20} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900">{step.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{step.description}</p>
          </div>
        ))}
      </div>

      <MPConnectCard />
    </div>
  );
};
