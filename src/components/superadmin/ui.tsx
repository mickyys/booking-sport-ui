"use client";
import React from 'react';
import { CenterStatus } from '@/api/superadminApi';

const statusMap: Record<CenterStatus, { label: string; cls: string }> = {
  active: { label: 'Activo', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  suspended: { label: 'Suspendido', cls: 'bg-amber-50 text-amber-800 ring-amber-600/25' },
  blocked: { label: 'Bloqueado', cls: 'bg-red-50 text-red-700 ring-red-600/20' },
};

export const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const s = statusMap[(status || 'active') as CenterStatus] ?? statusMap.active;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  );
};

export const PaymentModeBadge: React.FC<{ mode?: string }> = ({ mode }) => {
  if (mode === 'pay_online')
    return <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">Pago online</span>;
  if (mode === 'pay_at_center')
    return <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-500/20">Paga en el centro</span>;
  return <span className="text-xs text-slate-500">Sin definir</span>;
};

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const fieldCls =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600 disabled:opacity-60';

export const Field: React.FC<{ label: string; htmlFor: string; hint?: string; children: React.ReactNode }> = ({ label, htmlFor, hint, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-800">{label}</label>
    {children}
    {hint && <p className="text-xs text-slate-600">{hint}</p>}
  </div>
);

export const Pager: React.FC<{ page: number; limit: number; total: number; onPage: (p: number) => void }> = ({ page, limit, total, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span aria-live="polite">{total} resultados · página {page} de {pages}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Siguiente</button>
      </div>
    </div>
  );
};

export const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
export const formatDateTime = (s?: string) => (s ? new Date(s).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
