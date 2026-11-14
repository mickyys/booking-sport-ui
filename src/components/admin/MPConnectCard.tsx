"use client";
import React from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  ShieldCheck,
  Unlink,
} from 'lucide-react';
import { useMPConnect } from '@/hooks/useMPConnect';

export const MPConnectCard: React.FC = () => {
  const { status, isLoading, isConnecting, isDisconnecting, connect, disconnect } = useMPConnect();

  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const connected = status?.connected ?? false;

  if (connected) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-900">Cuenta conectada</h3>
              <p className="text-sm text-emerald-700 mt-1">
                Tu centro ya está habilitado para recibir pagos online con Mercado Pago en
                modo marketplace.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-white/70 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">ID Mercado Pago</p>
              <p className="font-mono font-semibold text-emerald-900 mt-1">{status?.mp_user_id || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/70 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Ambiente</p>
              <p className="font-semibold text-emerald-900 mt-1">
                {status?.live_mode ? 'Producción' : 'Pruebas (Sandbox)'}
              </p>
            </div>
            {status?.connected_at && (
              <div className="p-3 rounded-xl bg-white/70 border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Conectado</p>
                <p className="font-semibold text-emerald-900 mt-1">
                  {new Date(status.connected_at).toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-white/60 border-t border-emerald-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <ShieldCheck size={16} />
            Los pagos se procesan de forma segura por Mercado Pago
          </div>
          <button
            onClick={disconnect}
            disabled={isDisconnecting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all disabled:opacity-50"
          >
            {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink size={16} />}
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-slate-100 text-slate-500">
            <Link2 size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">Conecta tu cuenta de Mercado Pago</h3>
            <p className="text-sm text-slate-600 mt-1">
              Autoriza a ReservaloYA a procesar los pagos de tus reservas en tu cuenta de Mercado
              Pago. Al conectar, tus clientes podrán pagar online de forma segura.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              Recibe los pagos de tus reservas directamente en tu cuenta.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              Los clientes pueden pagar online sin necesidad de ir al recinto.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              Conecta en pocos pasos usando tu cuenta de Mercado Pago existente.
            </li>
          </ul>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <button
          onClick={connect}
          disabled={isConnecting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all disabled:opacity-60"
        >
          {isConnecting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ExternalLink size={18} />
          )}
          {isConnecting ? 'Redirigiendo a Mercado Pago...' : 'Conectar Mercado Pago'}
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">
          Serás redirigido a Mercado Pago para autorizar la conexión.
        </p>
      </div>
    </div>
  );
};
