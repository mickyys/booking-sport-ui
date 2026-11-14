"use client";

import React from 'react';
import { Trophy } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { platformDomain } from '@/utils/host';
import SportCenterDetailView from '@/components/views/SportCenterDetailView';

export function TenantLanding() {
  const { tenant, status, isLoading } = useTenant();

  if (isLoading || status === 'idle') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--brand-primary,#10b981)] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Cargando...</p>
      </div>
    );
  }

  if (status === 'error' || !tenant) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Trophy className="w-12 h-12 text-slate-300" />
        <h1 className="text-2xl font-bold text-slate-800">Sitio no encontrado</h1>
        <p className="text-slate-500">
          Este dominio no está asociado a ningún centro deportivo. Verifica la URL o visita {platformDomain()}.
        </p>
        <a
          href={`https://${platformDomain()}`}
          className="mt-2 inline-flex items-center px-6 py-2.5 rounded-full bg-[var(--brand-primary,#10b981)] text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Ir a ReservaloYA
        </a>
      </div>
    );
  }

  return <SportCenterDetailView slug={tenant.slug} />;
}

export default TenantLanding;