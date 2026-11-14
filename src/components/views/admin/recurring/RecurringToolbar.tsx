"use client";

import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  RecurringFilters,
  RecurringTab,
  countPanelFilters,
} from './recurringUtils';
import { RecurringFiltersSheet } from './RecurringFiltersSheet';

interface RecurringToolbarProps {
  filters: RecurringFilters;
  counts: { active: number; finished: number };
  courts: { id: string; name: string }[];
  onChange: (patch: Partial<RecurringFilters>) => void;
}

const TABS: { key: RecurringTab; label: string }[] = [
  { key: 'active', label: 'Activas' },
  { key: 'finished', label: 'Finalizadas' },
];

export const RecurringToolbar: React.FC<RecurringToolbarProps> = ({
  filters,
  counts,
  courts,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const panelCount = countPanelFilters(filters);

  return (
    <div data-testid="recurring-toolbar" className="space-y-3">
      <div
        role="group"
        aria-label="Estado de las reservas fijas"
        className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:w-80"
      >
        {TABS.map((tab) => {
          const isActive = filters.tab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange({ tab: tab.key })}
              className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold transition-colors ${
                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className="text-xs font-semibold text-slate-400">{counts[tab.key]}</span>
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
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="Buscar cliente, teléfono o cancha"
            aria-label="Buscar recurrencias por cliente, teléfono o cancha"
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

      <RecurringFiltersSheet
        open={open}
        onOpenChange={setOpen}
        courts={courts}
        courtId={filters.courtId}
        dayIndex={filters.dayIndex}
        onApply={(patch) => onChange(patch)}
      />
    </div>
  );
};
