"use client";

import React from 'react';
import { Ban, CheckCircle2, Clock, Inbox, LucideIcon, XCircle } from 'lucide-react';
import type { AccessStatus } from '@/api/accessApi';

export const STATUS_META: Record<AccessStatus, { label: string; icon: LucideIcon; badge: string; card: string; iconWrap: string }> = {
  pending: {
    label: 'Pendiente', icon: Clock,
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    card: 'data-[active=true]:border-amber-400 data-[active=true]:bg-amber-50/60',
    iconWrap: 'bg-amber-100 text-amber-700',
  },
  approved: {
    label: 'Aprobada', icon: CheckCircle2,
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    card: 'data-[active=true]:border-emerald-500 data-[active=true]:bg-emerald-50/60',
    iconWrap: 'bg-emerald-100 text-emerald-700',
  },
  rejected: {
    label: 'Rechazada', icon: XCircle,
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    card: 'data-[active=true]:border-rose-400 data-[active=true]:bg-rose-50/60',
    iconWrap: 'bg-rose-100 text-rose-700',
  },
  revoked: {
    label: 'Revocada', icon: Ban,
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    card: 'data-[active=true]:border-slate-400 data-[active=true]:bg-slate-100/70',
    iconWrap: 'bg-slate-200 text-slate-700',
  },
};

export const StatusBadge: React.FC<{ status: AccessStatus }> = ({ status }) => {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${m.badge}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {m.label}
    </span>
  );
};

function initialsOf(name?: string, email?: string) {
  const src = (name || email || '?').trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts.length > 1 ? parts[1][0] : '')).toUpperCase();
}

export const PersonAvatar: React.FC<{ name?: string; email?: string; className?: string }> = ({ name, email, className = '' }) => (
  <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 ${className}`}>
    {initialsOf(name, email)}
  </span>
);

const CARD_ORDER: AccessStatus[] = ['pending', 'approved', 'rejected', 'revoked'];
const CARD_LABEL: Record<AccessStatus, string> = {
  pending: 'Pendientes', approved: 'Aprobadas', rejected: 'Rechazadas', revoked: 'Revocadas',
};
const CARD_HINT: Record<AccessStatus, string> = {
  pending: 'Esperan tu revisión', approved: 'Pueden reservar', rejected: 'Sin acceso', revoked: 'Acceso retirado',
};

interface StatsProps {
  counts: Record<string, number>;
  active: string;
  loaded: boolean;
  onSelect: (status: string) => void;
}

export const AccessStatsCards: React.FC<StatsProps> = ({ counts, active, loaded, onSelect }) => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="group" aria-label="Filtrar por estado">
    {CARD_ORDER.map((s) => {
      const m = STATUS_META[s];
      const Icon = m.icon;
      const isActive = active === s;
      return (
        <button
          key={s}
          type="button"
          data-active={isActive}
          aria-pressed={isActive}
          onClick={() => onSelect(isActive ? '' : s)}
          className={`group flex min-h-[72px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors duration-200 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:p-4 ${m.card}`}
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.iconWrap}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-2xl font-bold leading-none tabular-nums text-slate-900">
              {loaded && counts[s] != null ? counts[s] : <span className="inline-block h-6 w-8 animate-pulse rounded bg-slate-200 align-middle" />}
            </span>
            <span className="mt-1 block truncate text-sm font-medium text-slate-700">{CARD_LABEL[s]}</span>
            <span className="hidden truncate text-xs text-slate-500 sm:block">{CARD_HINT[s]}</span>
          </span>
        </button>
      );
    })}
  </div>
);

export const AccessEmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
      <Inbox className="h-6 w-6" aria-hidden="true" />
    </span>
    <p className="font-semibold text-slate-800">{title}</p>
    <p className="max-w-sm text-sm text-slate-500">{description}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);
