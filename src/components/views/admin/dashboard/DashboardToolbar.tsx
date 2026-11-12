"use client";

import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { DashboardFiltersSheet } from './DashboardFiltersSheet';
import { STATUS_TABS } from './dashboardUtils';

interface DashboardToolbarProps {
  filters: { name: string; date: string; code: string; status: string };
  onChange: (patch: Partial<{ name: string; date: string; code: string; status: string }>) => void;
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({ filters, onChange }) => {
  const [open, setOpen] = useState(false);
  const [from, to] = (filters.date || '').split('|');
  const panelCount =
    (from || to ? 1 : 0) + (filters.code ? 1 : 0) + (filters.status === 'expired' ? 1 : 0);

  return (
    <div data-testid="dashboard-toolbar" className="space-y-3">
      <div
        role="group"
        aria-label="Estado de la reserva"
        className="-mx-1 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:mx-0 sm:w-fit"
      >
        {STATUS_TABS.map((tab) => {
          const isActive = filters.status === tab.key;
          return (
            <button
              key={tab.key || 'all'}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange({ status: tab.key })}
              className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-3.5 text-sm font-bold transition-colors ${
                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={filters.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Buscar cliente"
            aria-label="Buscar reservas por cliente"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <SlidersHorizontal size={16} />
          Filtros
          {panelCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs font-black text-white">
              {panelCount}
            </span>
          )}
        </button>
      </div>

      <DashboardFiltersSheet
        open={open}
        onOpenChange={setOpen}
        date={filters.date}
        code={filters.code}
        status={filters.status}
        onApply={(patch) => onChange(patch)}
      />
    </div>
  );
};
