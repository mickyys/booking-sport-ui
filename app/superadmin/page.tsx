"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth0 } from '@auth0/auth0-react';
import { Ban, Building2, CheckCircle2, CreditCard, PauseCircle, Star } from 'lucide-react';
import { apiError, AuditLog, CenterStats, sa } from '@/api/superadminApi';
import { PageHeader, formatDateTime } from '@/components/superadmin/ui';

export default function SuperAdminHome() {
  const { getAccessTokenSilently } = useAuth0();
  const [stats, setStats] = useState<CenterStats | null>(null);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        sa.stats(getAccessTokenSilently),
        sa.listAudit(getAccessTokenSilently, { limit: 8 }),
      ]);
      setStats(s);
      setAudit(a.items);
    } catch (e) {
      setError(apiError(e, 'No se pudo cargar el resumen'));
    }
  }, [getAccessTokenSilently]);

  useEffect(() => { load(); }, [load]);

  const cards = stats && [
    { label: 'Centros totales', value: stats.total, icon: Building2, tone: 'text-slate-700 bg-slate-100', href: '/superadmin/centers' },
    { label: 'Activos', value: stats.active, icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50', href: '/superadmin/centers?status=active' },
    { label: 'Suspendidos', value: stats.suspended, icon: PauseCircle, tone: 'text-amber-700 bg-amber-50', href: '/superadmin/centers?status=suspended' },
    { label: 'Bloqueados', value: stats.blocked, icon: Ban, tone: 'text-red-700 bg-red-50', href: '/superadmin/centers?status=blocked' },
    { label: 'Destacados', value: stats.featured, icon: Star, tone: 'text-yellow-700 bg-yellow-50', href: '/superadmin/centers?featured=true' },
    { label: 'Con pago online', value: stats.pay_online, icon: CreditCard, tone: 'text-indigo-700 bg-indigo-50', href: '/superadmin/centers?payment_mode=pay_online' },
  ];

  return (
    <>
      <PageHeader title="Resumen de plataforma" subtitle="Estado general de los centros deportivos y última actividad." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {!cards
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />)
          : cards.map((c) => (
              <Link key={c.label} href={c.href} className="group rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-emerald-600">
                <span className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${c.tone}`}><c.icon size={16} aria-hidden="true" /></span>
                <p className="text-2xl font-bold tabular-nums text-slate-900">{c.value}</p>
                <p className="text-xs font-medium text-slate-600">{c.label}</p>
              </Link>
            ))}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white" aria-labelledby="recent-activity">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id="recent-activity" className="text-sm font-bold text-slate-900">Actividad reciente</h2>
          <Link href="/superadmin/audit" className="text-sm font-semibold text-emerald-700 hover:underline">Ver todo</Link>
        </div>
        {audit.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">Aún no hay acciones registradas.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span><span className="font-semibold text-slate-900">{a.action}</span> <span className="text-slate-600">· {a.actor_email || a.actor_id}</span></span>
                <time className="text-xs text-slate-500">{formatDateTime(a.created_at)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
